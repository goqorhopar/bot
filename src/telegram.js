import TelegramBot from 'node-telegram-bot-api';
import { config } from './config.js';
import axios from 'axios';

const token = config.telegramBotToken;
let bot;

console.log('Telegram token status:', token ? 'PRESENT' : 'MISSING');

if (token) {
  try {
    // Используем polling вместо webhook для простоты
    bot = new TelegramBot(token, { 
      polling: {
        interval: 300,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });
    
    console.log('Telegram bot initialized successfully');

    // Команда старта
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      console.log(`Received /start from chat ${chatId}`);
      bot.sendMessage(chatId, `🤖 Добро пожаловать в Meeting Bot!\n\nДля анализа встречи отправьте:\n/process [ссылка_на_встречу] [ID_лида]`).catch(console.error);
    });

    // Команда обработки встречи
    bot.onText(/\/process (.+) (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      
      // Извлекаем и очищаем URL от лишних символов
      let meetingUrl = match[1].replace(/[\[\]]/g, ''); // Удаляем квадратные скобки
      const leadId = match[2].replace(/[\[\]]/g, ''); // Удаляем квадратные скобки
      
      // Проверяем, что URL начинается с http/https
      if (!meetingUrl.startsWith('http')) {
        meetingUrl = 'https://' + meetingUrl;
      }
      
      console.log(`Processing meeting: ${meetingUrl}, lead: ${leadId}`);
      
      try {
        await bot.sendMessage(chatId, '🚀 Начинаю обработку встречи...');
        
        // Используем внутренний URL для запроса
        const response = await axios.post(`http://localhost:${config.port}/process-meeting`, {
          meetingUrl,
          leadId
        });
        
        if (response.data.success) {
          await bot.sendMessage(chatId, '✅ Встреча успешно обработана! Отчет отправлен администратору.');
        } else {
          await bot.sendMessage(chatId, `❌ Ошибка обработки: ${response.data.error}`);
        }
      } catch (error) {
        console.error('Error processing meeting:', error);
        await bot.sendMessage(chatId, `❌ Ошибка: ${error.response?.data?.error || error.message}`);
      }
    });

    // Простая команда для тестирования
    bot.onText(/\/test/, (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, 'Бот работает корректно!').catch(console.error);
    });

    // Обработка ошибок бота
    bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
    
    bot.on('webhook_error', (error) => {
      console.error('Webhook error:', error);
    });
    
    console.log('Telegram bot started successfully');

  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
  }
} else {
  console.warn('TELEGRAM_BOT_TOKEN not set. Telegram bot will not start.');
}

// Функция для отправки сообщений
export async function sendMessage(chatId, message) {
  if (!bot) {
    console.error('Bot not initialized, cannot send message');
    return;
  }
  
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
    console.error('Error sending message to Telegram:', error);
  }
}

export default bot;
