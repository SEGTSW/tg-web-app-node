const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = '8257938639:AAG699Sy0zfSGo251oF2HNhN5I0iDNaz_lk';
const webAppUrl = 'https://mytg-web-app-react.vercel.app/';

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

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
            const data = JSON.parse(msg?.web_app_data?.data);

            await bot.sendMessage(chatId, 'Дякую за зворотній зв’язок!');
            await bot.sendMessage(chatId, 'Ваша країна: ' + data?.country);
            await bot.sendMessage(chatId, 'Ваша вулиця: ' + data?.street);

            setTimeout(async () => {
                await bot.sendMessage(chatId, 'Всю інформацію ви отримаєте в чаті.');
            }, 3000);
        } catch (e) {
            console.error(e);
        }
    }
});

app.post('/web-data', async (req, res) => {
    const { queryId, products, totalPrice } = req.body;

    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успішна покупка',
            input_message_content: {
                message_text: `Вітаю з покупкою! Ви купили товарів на суму: ${totalPrice} грн.`,
            },
        });

        return res.status(200).json({ ok: true });
    } catch (e) {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Не вдалося купити товар',
            input_message_content: {
                message_text: 'Помилка: не вдалося завершити покупку 😞',
            },
        });

        return res.status(500).json({ ok: false });
    }
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log('Listening on port ' + PORT);
});
