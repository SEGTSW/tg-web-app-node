const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = process.env.BOT_TOKEN || '8257938639:AAG699Sy0zfSGo251oF2HNhN5I0iDNaz_lk';
const webAppUrl = process.env.WEB_APP_URL || 'https://mytg-web-app-react.vercel.app/';
const serverUrl = process.env.SERVER_URL || 'https://tg-web-app-node-nvcp.onrender.com';

const bot = new TelegramBot(token, { webHook: true });
bot.setWebHook(`${serverUrl}/bot${token}`);

const app = express();
app.use(express.json());
app.use(cors());

// Основна логіка бота
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Нижче появиться вікно для форми', {
            reply_markup: {
                keyboard: [
                    [{ text: 'Форма', web_app: { url: webAppUrl + '/form' } }]
                ]
            },
        });

        await bot.sendMessage(chatId, 'Заходь у наш інтернет-магазин', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Магазин', web_app: { url: webAppUrl } }]
                ]
            },
        });
    }

    if (msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg.web_app_data.data);

            await bot.sendMessage(chatId, 'Дякую за зворотній зв’язок!');
            await bot.sendMessage(chatId, `Ваша країна: ${data.country}`);
            await bot.sendMessage(chatId, `Ваша вулиця: ${data.street}`);

            setTimeout(async () => {
                await bot.sendMessage(chatId, 'Всю інформацію ви отримаєте в чаті.');
            }, 3000);
        } catch (e) {
            console.error(e);
        }
    }
});

// Обробка запиту від WebApp після покупки
app.post('/web-data', async (req, res) => {
    const { queryId, products, totalPrice } = req.body;

    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успішна покупка 🎉',
            input_message_content: {
                message_text: `Вітаю з покупкою! Ви купили товарів на суму: ${totalPrice} грн.`,
            },
        });
        return res.status(200).json({ ok: true });
    } catch (e) {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Помилка 😞',
            input_message_content: {
                message_text: 'Не вдалося завершити покупку. Спробуйте ще раз.',
            },
        });
        return res.status(500).json({ ok: false });
    }
});

// Telegram буде надсилати запити на цей шлях
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
