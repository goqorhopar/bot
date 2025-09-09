// Исправленный обработчик команды /process
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
