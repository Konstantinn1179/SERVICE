const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL || 'https://google.com'; // Placeholder until we get the tunnel URL

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  console.log(`Received message from ${chatId}: ${text}`);

  if (text && text.toLowerCase().includes('/start')) {
    try {
      await bot.sendMessage(chatId, 'Добро пожаловать в АКПП-центр! 🚗\nНажмите кнопку ниже, чтобы открыть приложение.', {
        reply_markup: {
          inline_keyboard: [
              [{ text: "Открыть приложение", web_app: { url: webAppUrl } }]
          ]
        }
      });
      console.log('Sent welcome message');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  if (text === '/myid') {
    bot.sendMessage(chatId, `Ваш ID: \`${chatId}\`\nДобавьте этот ID в .env файл как ADMIN_CHAT_ID, чтобы получать уведомления о заявках.`, { parse_mode: 'Markdown' });
  }
});

console.log('Telegram Bot is running...');
