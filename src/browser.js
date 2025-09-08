import puppeteer from 'puppeteer';
import { config } from './config.js';

export async function openMeeting({ url, logger }) {
  const browser = await puppeteer.launch({
    executablePath: config.chromiumPath,
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-stream',
      '--mute-audio',
      '--window-size=1280,800'
    ]
  });

  const page = await browser.newPage();

  // Устанавливаем user-agent
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  logger.info({ url }, 'Opening meeting page...');
  
  try {
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    // Ждем загрузки страницы
    await page.waitForTimeout(5000);

    // Пытаемся найти и нажать кнопку присоединения
    const joinSelectors = [
      'button[data-join="true"]',
      'button:contains("Join")',
      'button:contains("Присоединиться")',
      'button:contains("Войти")',
      'div[role="button"]:contains("Join")',
      'div[role="button"]:contains("Присоединиться")'
    ];

    for (const selector of joinSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          await page.click(selector);
          logger.info('Clicked join button');
          await page.waitForTimeout(3000);
          break;
        }
      } catch (e) {
        // Продолжаем尝试其他选择器
      }
    }

    // Ждем присоединения к встрече
    await page.waitForTimeout(10000);

    logger.info('Successfully joined the meeting');

    return { browser, page };

  } catch (error) {
    await browser.close();
    throw new Error(`Failed to join meeting: ${error.message}`);
  }
}
