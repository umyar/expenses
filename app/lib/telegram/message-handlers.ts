import { Context } from 'grammy';
import { Type } from '@google/genai';
import postgres from 'postgres';

import { gemini } from '@/app/lib/gemini';

const token = process.env.TELEGRAM_BOT_TOKEN!;
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const getVendorName = (fileName: string | undefined) => {
  if (fileName) {
    return fileName.includes('Continente') ? 1 : 2;
  }

  return null;
};

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

  const groceriesVendor = getVendorName(message.document!.file_name);
  const isContinenteReceipt = groceriesVendor === 1;

  const contents = [
    {
      text:
        // 'Role: Act as an expert data extraction assistant specialized in retail receipts.\n' +
        // '\n' +
        // 'Task: Analyze the provided PDF receipt and extract the following information into a structured format.\n' +
        // '\n' +
        // 'Rules for Extraction:\n' +
        // '\n' +
        // 'Item List: List every purchased item.\n' +
        // '\n' +
        // 'Ignore Discounts: Do not include discounts, coupons, or price deductions as separate line items. Extract only the standard price of the items.\n' +
        // '\n' +
        // 'Naming: Translate the item name to Russian. Include the original Portuguese name in parentheses immediately after (e.g., "Яблоки (Maçãs)").\n' +
        // '\n' +
        // 'Categorization: Assign one of two categories to each item:\n' +
        // '\n' +
        // 'groceries: Anything edible or drinkable.\n' +
        // '\n' +
        // 'other: Non-food items (cleaning supplies, hygiene, bags, etc.).\n' +
        // '\n' +
        // 'Pricing (In Cents): Provide the price of each individual item and the Total Price strictly in cents (e.g., a price of 2.28 must be converted to 228).\n' +
        // '\n' +
        // 'Metadata: Extract the Date from the receipt in YYYY-MM-DD format and the Total Price in cents.',

        `
        Role: Act as an expert data extraction assistant specialized in retail receipts.
        Task: Analyze the provided PDF receipt and extract the following information into a structured format.
        Rules for Extraction:
        Item List: List every purchased item.
        ${
          isContinenteReceipt
            ? '\nIgnore Discounts: Do not include discounts, coupons, or price deductions as separate line items. Extract only the standard price of the items.\n'
            : ''
        }
        Naming: Translate the item name to Russian. Include the original Portuguese name in parentheses immediately after (e.g., "Яблоки (Maçãs)").
        Categorization: Assign one of two categories to each item:
        groceries: Anything edible or drinkable.
        other: Non-food items (cleaning supplies, hygiene, bags, etc.).
        Pricing (In Cents): Provide the price of each individual item and the Total Price strictly in cents (e.g., a price of 2.28 must be converted to 228).
        Metadata: Extract the Date from the receipt in YYYY-MM-DD format and the Total Price in cents.
        `,
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

  const addedBy = message.from.username!;

  const itemsSum: number = itemsList.reduce((acc: number, item) => {
    if (item.price > 0) {
      acc += item.price;
    }

    return acc;
  }, 0);

  // console.log('🆘 itemsList', itemsList);
  // console.log('🆘 amounts:', { totalPrice, itemsSum });
  // return;

  if (itemsSum !== totalPrice) {
    console.log('❗️Not equal:', { itemsSum, receiptAmount: totalPrice });
    await ctx.reply(`❗️ERROR with ${message.document.file_name} while checking sums`);
    return;
  }

  try {
    await sql.begin(async tx => {
      const [user] = await tx`
        SELECT id FROM users WHERE telegram = ${addedBy}
      `;

      const [receipt] = await tx`
        INSERT INTO receipts (vendor, added_by, total_amount, receipt_date)
        VALUES (${groceriesVendor}, ${user.id}, ${totalPrice}, ${date})
        RETURNING id
  `;

      const receiptId = receipt.id;

      await tx`
        INSERT INTO expenses ${sql(
          itemsList.map(i => ({
            name: i.name,
            category: i.category,
            amount: i.price,
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
    await ctx.reply(`✅ ${message.document.file_name}. TOTAL PRICE: ${totalPrice} cents`);
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
