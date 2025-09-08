import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';

const client = new GoogleGenerativeAI(config.geminiApiKey);

export async function transcribeAudio(filePath, logger) {
  try {
    // Используем Gemini для транскрипции аудио
    // В реальном приложении нужно загрузить аудиофайл и отправить его в Gemini
    // Но для простоты демонстрации используем заглушку
    
    logger.info('Transcription started using Gemini');
    
    // Заглушка для демонстрации
    const demoTranscript = `
    Менеджер: Добрый день! Меня зовут Алексей, я представитель компании Skill to Lead. 
    Клиент: Здравствуйте, меня зовут Иван. 
    Менеджер: Иван, расскажите пожалуйста о вашем бизнесе и текущих задачах.
    Клиент: У нас IT компания, занимаемся разработкой мобильных приложений. 
    Основная задача сейчас - увеличить количество качественных лидов.
    Менеджер: Понятно. А как вы сейчас привлекаете клиентов?
    Клиент: В основном через контекстную рекламу, но эффективность падает.
    Менеджер: Мы можем помочь с генерацией целевых лидов через холодные звонки.
    Клиент: Это интересно. Расскажите подробнее.
    `;
    
    return demoTranscript;
    
  } catch (error) {
    logger.error({ error }, 'Transcription failed');
    throw new Error(`Transcription error: ${error.message}`);
  }
}
