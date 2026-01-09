# OpenRouter Telegram Bot (Render-friendly, no webhook)

Этот бот работает через **long polling**, поэтому **не нужен HTTPS/webhook**.
Идеально для Render: просто деплой и задайте переменные окружения.

## 1) Загрузка в GitHub
Загрузите все файлы этого проекта в корень репозитория.

## 2) Deploy на Render
Render → New → **Background Worker** (рекомендуется) или Web Service.

### Команды
- Build: `npm install`
- Start: `npm start`

## 3) Variables (Render → Environment / Variables)
- `TELEGRAM_TOKEN` — токен BotFather
- `OPENROUTER_API_KEY` — ключ OpenRouter
- `MODEL` — например `openai/gpt-4o-mini`
- `SYSTEM_PROMPT` — системный промпт (опционально)

## Проверка
В Telegram:
- `/start`
- `/ping`
- любой текст → ответ от модели
