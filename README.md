# Meeting Assistant Bot

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://docker.com)
[![Gemini](https://img.shields.io/badge/Gemini-AI-orange.svg)](https://ai.google.dev)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-blue.svg)](https://core.telegram.org/bots)

Бот-ассистент для онлайн-встреч: автоматическое подключение, запись аудио, транскрипция через Gemini AI, проверка по чеклисту и обновление лидов в Bitrix24.

## Возможности

- **Автоподключение** к встречам через Puppeteer (Google Meet, Zoom, Яндекс Телемост, Контур.Толк, MS Teams)
- **Запись аудио** на всю длительность встречи
- **Транскрипция** через Gemini AI
- **Анализ по чеклисту** — структурированный отчёт по итогам встречи
- **Telegram-управление** — отправьте ссылку, получите отчёт
- **Интеграция с Bitrix24** — автообновление лидов

## Быстрый старт

```bash
# Клонирование
git clone https://github.com/goqorhopar/bot.git
cd bot

# Установка
npm install

# Настройка
cp .env.example .env
# Отредактируйте .env

# Запуск
npm start
```

## Docker

```bash
docker build -t meeting-bot .
docker run -d --env-file .env meeting-bot
```

## Переменные окружения

| Переменная | Описание |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота |
| `TELEGRAM_CHAT_ID` | ID чата для команд |
| `GEMINI_API_KEY` | API ключ Google Gemini |
| `BITRIX_WEBHOOK_URL` | Webhook Bitrix24 |
| `OPENAI_API_KEY` | API ключ OpenAI (опционально) |
| `LOG_LEVEL` | Уровень логирования |

## Структура

```
├── src/
│   ├── index.js        # Express сервер + API
│   ├── bitrix.js       # Bitrix24 интеграция
│   ├── browser.js      # Puppeteer управление браузером
│   ├── config.js       # Конфигурация
│   ├── gemini.js       # Gemini AI анализ
│   ├── recording.js    # Запись аудио
│   ├── telegram.js     # Telegram бот
│   └── transcribe.js   # Транскрипция аудио
├── Dockerfile
├── docker-compose.yml
└── render.yaml
```

## Deploy

- **Render**: подключите репозиторий, укажите `render.yaml`
- **Docker**: `docker compose up -d`
