import puppeteer from 'puppeteer';
import { config } from './config.js';

export async function openMeeting({ url, logger }) {
  // Валидация URL
  try {
    new URL(url);
  } catch (e) {
    throw new Error(`Invalid URL format: ${url}`);
  }

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
      '--window-size=1280,800',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=site-per-process'
    ]
  });

  const page = await browser.newPage();

  // Устанавливаем user-agent для обхода детекции ботов
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Эмулируем человеческое поведение
  await page.setViewport({ width: 1280, height: 800 });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  // Разрешаем все permissions
  const client = await page.createCDPSession();
  await client.send('Browser.setPermission', {
    origin: new URL(url).origin,
    permission: { name: 'audioCapture' },
    setting: 'granted'
  });
  await client.send('Browser.setPermission', {
    origin: new URL(url).origin,
    permission: { name: 'videoCapture' },
    setting: 'granted'
  });

  logger.info({ url }, 'Opening meeting page...');
  
  try {
    // Настраиваем таймауты для загрузки страницы
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
      'div[role="button"]:contains("Присоединиться")',
      'button[aria-label*="Join"]',
      'button[aria-label*="join"]',
      'button[aria-label*="Присоединиться"]',
      'button[title*="Join"]',
      'button[title*="Присоединиться"]'
    ];

    let joined = false;
    for (const selector of joinSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        logger.info(`Clicked join button: ${selector}`);
        joined = true;
        await page.waitForTimeout(3000);
        break;
      } catch (e) {
        // Продолжаем попытки с другими селекторами
      }
    }

    if (!joined) {
      // Если не нашли кнопку, пробуем через JavaScript
      try {
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const joinButton = buttons.find(btn => 
            btn.textContent && (btn.textContent.match(/join|присоединиться|войти/i))
          );
          if (joinButton) joinButton.click();
        });
        joined = true;
        logger.info('Clicked join button via JavaScript');
      } catch (e) {
        logger.warn('Could not find join button via JavaScript');
      }
    }

    // Ждем присоединения к встрече
    await page.waitForTimeout(10000);

    // Пытаемся отключить микрофон и камеру
    const muteSelectors = [
      'button[aria-label*="mute"]',
      'button[aria-label*="Mute"]',
      'button[aria-label*="Выключить микрофон"]',
      'button[data-testid*="mute"]',
      'button[title*="mute"]',
      'button[title*="Mute"]'
    ];

    for (const selector of muteSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        await page.click(selector);
        logger.info('Muted microphone');
        break;
      } catch (e) {
        // Continue
      }
    }

    // Для Zoom-специфичных элементов
    try {
      // Попытка закрыть всплывающие окна в Zoom
      await page.evaluate(() => {
        const closeButtons = Array.from(document.querySelectorAll('button[aria-label*="close"], button[aria-label*="Close"]'));
        if (closeButtons.length > 0) {
          closeButtons[0].click();
        }
      });
    } catch (e) {
      // Игнорируем ошибки при закрытии всплывающих окон
    }

    logger.info('Successfully joined the meeting');

    return { browser, page };

  } catch (error) {
    await browser.close();
    throw new Error(`Failed to join meeting: ${error.message}`);
  }
}
