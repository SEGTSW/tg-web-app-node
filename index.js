const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = process.env.BOT_TOKEN || '8257938639:AAG699Sy0zfSGo251oF2HNhN5I0iDNaz_lk';
const webAppUrl = process.env.WEB_APP_URL || 'https://mytg-web-app-react.vercel.app';
const serverUrl = process.env.SERVER_URL || 'https://tg-web-app-node-nvcp.onrender.com';

const bot = new TelegramBot(token, { webHook: true });
bot.setWebHook(`${serverUrl}/bot${token}`);

const app = express();
app.use(express.json());
app.use(cors());

// Основна логіка бота
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // Якщо користувач натискає /start
    if (msg.text === '/start') {
        // Кнопка для форми
        await bot.sendMessage(chatId, 'Нижче появиться вікно для форми', {
            reply_markup: {
                keyboard: [
                    [{ text: 'Форма', web_app: { url: `${webAppUrl}/form` } }]
                ],
                resize_keyboard: true
            },
        });

        // Кнопка для магазину
        await bot.sendMessage(chatId, 'Заходь у наш інтернет-магазин', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Магазин', web_app: { url: `${webAppUrl}/shop` } }]
                ]
            },
        });
    }

    // Обробка даних з Web App (форма або покупка)
    if (msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg.web_app_data.data);

            // Якщо дані з форми
            if (data.country && data.street) {
                await bot.sendMessage(chatId, 'Дякую за зворотній зв’язок!');
                await bot.sendMessage(chatId, `Ваша країна: ${data.country}`);
                await bot.sendMessage(chatId, `Ваша вулиця: ${data.street}`);

                setTimeout(async () => {
                    await bot.sendMessage(chatId, 'Всю інформацію ви отримаєте в чаті.');
                }, 3000);
            }

            // Якщо дані про покупку
            if (data.products && data.totalPrice) {
                let productList = data.products.map(p => `- ${p.name}: ${p.price} грн`).join('\n');

                await bot.sendMessage(chatId, `Ви придбали товари:\n${productList}\n\nСума: ${data.totalPrice} грн 🎉`);
            }

        } catch (e) {
            console.error('Помилка парсингу web_app_data:', e);
        }
    }
});

// Telegram буде надсилати запити на цей шлях
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
