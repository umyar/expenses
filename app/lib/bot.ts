import { Bot } from 'grammy';
import { Type } from '@google/genai';
import postgres from 'postgres';

import { gemini } from './gemini';

const token = process.env.TELEGRAM_BOT_TOKEN!;

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

let bot: Bot;

if (!(globalThis as any).grammyBot) {
  bot = new Bot(token);

  bot.on('message', async ctx => {
    const { message } = ctx;

    if (message.document && message.document.mime_type === 'application/pdf') {
      console.log(message.document.file_id);
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
          text: 'Parse this receipt and give me the list of bought items. Also add the category for each item. It might be one of 2 categories: food or other. To other goes everything what cannot be eaten or drunk. Name for each item should be translated to Russian and original Portuguese name from the receipt should be given in parentheses.',
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
      };

      const aiResponse = await gemini(contents, config);

      console.log('🆘 aiResponse', aiResponse);
      console.log('🆘 aiResponse.text', aiResponse.text);

      await ctx.reply(`Receipt handled: ${message.document.file_name}`);
      return;
    }

    await ctx.reply('Received: ' + ctx.message.text);
  });

  await bot.init();

  (globalThis as any).grammyBot = bot;
} else {
  bot = (globalThis as any).grammyBot;
}

export default bot;
