import express from 'express';
import pino from 'pino';
import { openMeeting } from './browser.js';
import { startPulseRecording, stopRecording } from './recording.js';
import { transcribeAudio } from './transcribe.js';
import { runChecklist } from './gemini.js';
import { sendMessage } from './telegram.js';
import { config } from './config.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  }
});

const app = express();
app.use(express.json({ limit: '10mb' }));

// Healthcheck
app.get('/health', (_, res) => res.status(200).send('ok'));

// Endpoint для полного цикла анализа встречи
app.post('/process-meeting', async (req, res) => {
  const { meetingUrl, leadId } = req.body || {};
  
  if (!meetingUrl) {
    return res.status(400).json({ error: 'meetingUrl is required' });
  }

  logger.info({ meetingUrl, leadId }, 'Meeting processing request received');

  let browser, page, rec;
  try {
    // Открываем встречу
    ({ browser, page } = await openMeeting({ url: meetingUrl, logger }));

    // Старт записи системного звука
    rec = startPulseRecording({ logger });

    // Ждём окончания встречи (максимум 1 час)
    await page.waitForTimeout(config.recording.maxSeconds * 1000);

    // Останавливаем запись
    const outfile = await stopRecording(rec);
    logger.info({ outfile }, 'Recording saved');

    // Транскрипт через Gemini
    const transcript = await transcribeAudio(outfile, logger);
    logger.info({ length: transcript.length }, 'Transcript received');

    // Анализ по чек-листу через Gemini
    const analysisResult = await runChecklist(transcript, logger);
    logger.info({ analysisResult }, 'Meeting analysis done');

    // Формируем отчет для отправки админу
    const reportMessage = `
📊 ОТЧЕТ ПО ВСТРЕЧЕ

🔗 Ссылка: ${meetingUrl}
📋 ID лида: ${leadId || 'Не указан'}

📝 Длина транскрипта: ${transcript.length} символов
⭐ Общая оценка: ${analysisResult.overallScore}/100
🏷️ Категория клиента: ${analysisResult.category}

📋 Результаты анализа:
${Object.entries(analysisResult.points || {}).map(([key, value]) => 
  `${key}. ${value.score}/10 - ${value.comment.substring(0, 50)}...`
).join('\n')}

💡 Резюме:
${analysisResult.summary}

🎧 Транскрипт (первые 500 символов):
${transcript.substring(0, 500)}...
    `.trim();

    // Отправляем отчет админу
    if (config.adminChatId) {
      await sendMessage(config.adminChatId, reportMessage);
      logger.info('Report sent to admin');
    }

    res.json({
      success: true,
      meetingUrl,
      leadId,
      transcriptLength: transcript.length,
      analysis: analysisResult
    });

  } catch (e) {
    logger.error({ err: e }, 'Meeting processing failed');
    
    // Отправляем ошибку админу
    if (config.adminChatId) {
      await sendMessage(config.adminChatId, 
        `❌ Ошибка обработки встречи: ${meetingUrl}\nОшибка: ${e.message}`
      );
    }
    
    res.status(500).json({ 
      success: false, 
      error: e.message || 'Internal error',
      meetingUrl,
      leadId
    });
  } finally {
    try { if (rec) await stopRecording(rec); } catch (_) {}
    try { if (page) await page.close(); } catch (_) {}
    try { if (browser) await browser.close(); } catch (_) {}
  }
});

// Запускаем сервер
app.listen(config.port, () => {
  logger.info({ port: config.port }, 'Server started');
});