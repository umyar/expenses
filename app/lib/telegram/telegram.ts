import { Bot } from 'grammy';

import { pdfHandler, textHandler } from './message-handlers';

const token = process.env.TELEGRAM_BOT_TOKEN!;
const PERMISSIBLE_USERS = ['umyar', 'IusupovaIu'];

let bot: Bot;

if (!(globalThis as any).grammyBot) {
  bot = new Bot(token);

  bot.on('message', async ctx => {
    const { message } = ctx;

    if (!message.from?.username || !PERMISSIBLE_USERS.includes(message.from.username)) {
      // TODO: log this somewhere + CHECK!
      console.log('invalid message: ', message);
      return;
    }

    if (message.document && message.document.mime_type === 'application/pdf') {
      await pdfHandler(ctx);
      return;
    }

    if (message.text) {
      await textHandler(ctx);
      return;
    }

    await ctx.reply(`No registered handler for your message: [ ${ctx.message.text} ]`);
  });

  await bot.init();

  (globalThis as any).grammyBot = bot;
} else {
  bot = (globalThis as any).grammyBot;
}

export default bot;
