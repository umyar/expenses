import { Context } from 'grammy';
import { Type } from '@google/genai';
import postgres from 'postgres';

import { gemini } from '@/app/lib/gemini';

const token = process.env.TELEGRAM_BOT_TOKEN!;
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

interface IParsedDataItem {
  name: string;
  price: number;
  category: string;
}

interface IParsedData {
  totalPrice: number;
  date: string;
  itemsList: IParsedDataItem[];
}

interface IPreparedItem extends Omit<IParsedDataItem, 'price'> {
  amount: number;
}

export const pdfHandler = async (ctx: Context) => {
  const { message } = ctx;

  if (!message || !message.document) {
    throw new Error('Expected message to have a document in pdfHandler');
  }

  const file = await ctx.getFile();
  const path = file.file_path;

  const fileUrl = `https://api.telegram.org/file/bot${token}/${path}`;

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to download file from telegram api: ${response.statusText}`);
  }

  const pdfArrayBuffer = Buffer.from(await response.arrayBuffer());

  const contents = [
    {
      text: 'Parse this receipt and give me the list of bought items. Also add the category for each item. It might be one of 2 categories: groceries or other. To other goes everything what cannot be eaten or drunk. Name for each item should be translated to Russian and original Portuguese name from the receipt should be given in parentheses. Do not deduct discounts. Also give a total price and date from the receipt in YYYY-MM-DD format.',
    },
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: Buffer.from(pdfArrayBuffer).toString('base64'),
      },
    },
  ];

  const config = {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
        },
        totalPrice: {
          type: Type.NUMBER,
        },
        itemsList: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
              },
              price: {
                type: Type.NUMBER,
              },
              category: {
                type: Type.STRING,
              },
            },
          },
        },
      },
    },
  };

  const aiResponse = await gemini(contents, config);

  // console.log('🆘 aiResponse', aiResponse);
  // console.log('🆘 aiResponse.text', aiResponse.text);

  const cleanedTextResponse = aiResponse.text?.trim().replace(/```json\n|```/g, '');
  const parsedData: IParsedData = cleanedTextResponse ? JSON.parse(cleanedTextResponse) : null;

  if (!parsedData) {
    await ctx.reply(`Something went wrong while parsing the response from gemini`);
  }

  const { totalPrice, date, itemsList } = parsedData;
  const receiptAmountInCents = Math.floor(totalPrice * 100);
  const getVendorName = () => {
    const fileName = message.document!.file_name;

    if (fileName) {
      return fileName.includes('Continente') ? 1 : 2;
    }

    return null;
  };
  const addedBy = message.from.username!;

  let itemsCentsSum = 0;

  const preparedItems: IPreparedItem[] = itemsList.reduce((acc: IPreparedItem[], item) => {
    const { price, category, name } = item;

    if (price > 0) {
      const priceInCents = Math.floor(item.price * 100);
      itemsCentsSum += priceInCents;

      acc.push({
        name,
        category,
        amount: priceInCents,
      });
    }

    return acc;
  }, []);

  if (itemsCentsSum !== receiptAmountInCents) {
    console.log('❗️Not equal:', { itemsSum: itemsCentsSum, receiptAmount: receiptAmountInCents });
    await ctx.reply(`❗️ERROR with ${message.document.file_name} while checking sums`);
    return;
  }

  // console.log('🆘 itemsList', itemsList);
  // console.log('🆘 preparedItems', preparedItems);

  try {
    await sql.begin(async tx => {
      const [user] = await tx`
        SELECT id FROM users WHERE telegram = ${addedBy}
      `;

      const [receipt] = await tx`
        INSERT INTO receipts (vendor, added_by, total_amount, receipt_date)
        VALUES (${getVendorName()}, ${user.id}, ${receiptAmountInCents}, ${date})
        RETURNING id
  `;

      const receiptId = receipt.id;

      await tx`
        INSERT INTO expenses ${sql(
          preparedItems.map(i => ({
            name: i.name,
            category: i.category,
            amount: i.amount,
            receipt_id: receiptId,
            expense_date: date,
            added_by: user.id,
          })),
          'name',
          'category',
          'amount',
          'receipt_id',
          'expense_date',
          'added_by',
        )}
  `;
    });
    await ctx.reply(`✅ ${message.document.file_name}`);
  } catch (e) {
    console.error(e);
    await ctx.reply(`❗️SQL ERROR with ${message.document.file_name}`);
  }
};

const categoriesDictionary: Record<string, string> = {
  g: 'groceries',
  pc: 'personal-care',
  rd: 'restaurants-delivery',
  t: 'transportation',
  u: 'utilities',
  o: 'other',
  cs: 'clothes-shoes',
};

export const textHandler = async (ctx: Context) => {
  const { message } = ctx;

  if (!message || !message.text) {
    throw new Error('Expected message to have a text in textHandler');
  }

  const separatedNodes = message.text.split('\n');

  const [name, amount, category] = separatedNodes;

  const addedBy = message.from.username!;
  const expenseCategory = categoriesDictionary[category] || 'other';
  const amountParsed = Number(amount.replace(',', '.'));
  const amountInCents = Math.floor(amountParsed * 100);

  try {
    await sql`
      INSERT INTO expenses (name, amount, category, added_by)
      VALUES (${name}, ${amountInCents}, ${expenseCategory}, (SELECT id FROM users WHERE telegram = ${addedBy}))
    `;
    await ctx.reply(`✅ ${name} | ${amount} | ${expenseCategory}`);
  } catch (e) {
    console.error(e);
    await ctx.reply(`❗️ERROR with: ${name} | ${amount} | ${expenseCategory}`);
  }
};
