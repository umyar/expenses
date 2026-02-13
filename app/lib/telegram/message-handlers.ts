import { Context } from 'grammy';
import { Type } from '@google/genai';
import postgres from 'postgres';

import { categoriesDictionary } from '@/app/lib/constants';
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
  category: number;
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
      text: `
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
        Categorization: Assign one of three categories to each item (put category number to the response):
        Groceries (category number is 1): Anything edible or drinkable.
        Personal Care (category number is 3): Hygiene (creams, toothbrushes, toothpaste, soap, etc.).
        Household (category number is 8): Household items (home furnishing & electronics, rags, detergents, dishwasher detergents, etc.).
        Other (category number is 6): Category for the rest items.
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
                type: Type.NUMBER,
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
        SELECT user_id FROM users WHERE telegram = ${addedBy}
      `;

      const [receipt] = await tx`
        INSERT INTO receipt (vendor, user_id, amount, receipt_date)
        VALUES (${groceriesVendor}, ${user.user_id}, ${totalPrice}, ${date})
        RETURNING receipt_id
  `;

      const receiptId = receipt.receipt_id;

      await tx`
        INSERT INTO expense ${sql(
          itemsList.map(i => ({
            name: i.name,
            category_id: i.category,
            amount: i.price,
            receipt_id: receiptId,
            expense_date: date,
            user_id: user.user_id,
          })),
          'name',
          'category_id',
          'amount',
          'receipt_id',
          'expense_date',
          'user_id',
        )}
  `;
    });
    await ctx.reply(`✅ ${message.document.file_name}. TOTAL PRICE: ${totalPrice} cents`);
  } catch (e) {
    console.error(e);
    await ctx.reply(`❗️SQL ERROR with ${message.document.file_name}`);
  }
};

const categoryIdsDictionary: Record<string, number> = {
  g: 1,
  u: 2,
  pc: 3,
  rd: 4,
  t: 5,
  o: 6,
  cs: 7,
  h: 8,
};

const METRO_PRICE = 1.4;

export const textHandler = async (ctx: Context) => {
  const { message } = ctx;

  if (!message || !message.text) {
    throw new Error('Expected message to have a text in textHandler');
  }

  const separatedNodes = message.text.split('\n');

  const [name, amount, category] = separatedNodes;

  const addedBy = message.from.username!;
  let expenseName = name;
  let expenseCategory = categoryIdsDictionary[category] || 6;
  const amountParsed = amount ? Number(amount.replace(',', '.')) : 0;
  let amountInCents = Math.floor(amountParsed * 100);

  if (!amount || !category) {
    const match = name.match(/^([мМ])(\d)$/);

    if (match) {
      const letter = match[1]; // for the future
      const number = Number(match[2]);

      expenseName = 'Метро';
      expenseCategory = 5;
      const expenseAmount = Number(number) * METRO_PRICE;
      amountInCents = Math.floor(expenseAmount * 100);
    } else {
      await ctx.reply(`❗️ERROR: could not parse the message.`);
      return;
    }
  }

  try {
    await sql`
      INSERT INTO expense (name, amount, category_id, user_id)
      VALUES (${expenseName}, ${amountInCents}, ${expenseCategory}, (SELECT user_id FROM users WHERE telegram = ${addedBy}))
    `;
    await ctx.reply(`✅ ${expenseName} | ${amountInCents} cents | ${categoriesDictionary[expenseCategory]}`);
  } catch (e) {
    console.error(e);
    await ctx.reply(`❗️ERROR with: ${expenseName} | ${amountInCents} cents | ${categoriesDictionary[expenseCategory]}`);
  }
};
