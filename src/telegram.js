import TelegramBot from 'node-telegram-bot-api';
import { config } from './config.js';
import axios from 'axios';

const token = config.telegramBotToken;
let bot;

if (token) {
  bot = new TelegramBot(token, { polling: true });
  
  // Команда старта
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `🤖 Добро пожаловать в Meeting Bot!\n\nДля анализа встречи отправьте:\n/process [ссылка_на_встречу] [ID_лида]`);
  });

  // Команда обработки встречи
  bot.onText(/\/process (.+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const meetingUrl = match[1];
    const leadId = match[2];
    
    try {
      bot.sendMessage(chatId, '🚀 Начинаю обработку встречи...');
      
      // Отправляем запрос на обработку встречи
      const response = await axios.post(`http://localhost:${config.port}/process-meeting`, {
        meetingUrl,
        leadId
      });
      
      if (response.data.success) {
        bot.sendMessage(chatId, '✅ Встреча успешно обработана! Отчет отправлен администратору.');
      } else {
        bot.sendMessage(chatId, `❌ Ошибка обработки: ${response.data.error}`);
      }
    } catch (error) {
      bot.sendMessage(chatId, `❌ Ошибка: ${error.response?.data?.error || error.message}`);
    }
  });

  // Простая команда для тестирования
  bot.onText(/\/test/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Бот работает корректно!');
  });

  console.log('Telegram бот запущен');
}

// Функция для отправки сообщений
export async function sendMessage(chatId, message) {
  if (!bot) return;
  
  try {
    // Разбиваем длинные сообщения на части
    const maxLength = 4096;
    if (message.length > maxLength) {
      for (let i = 0; i < message.length; i += maxLength) {
        await bot.sendMessage(chatId, message.substring(i, i + maxLength));
      }
    } else {
      await bot.sendMessage(chatId, message);
    }
  } catch (error) {
    console.error('Ошибка отправки сообщения в Telegram:', error);
  }
}

export default bot;
