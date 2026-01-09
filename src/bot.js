const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const pino = require('pino');

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const TELEGRAM_TOKEN = (process.env.TELEGRAM_TOKEN || '').trim();
const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();
const MODEL = (process.env.MODEL || 'openai/gpt-4o-mini').trim();
const SYSTEM_PROMPT = (process.env.SYSTEM_PROMPT || 'Ты полезный ассистент.').trim();

if (!TELEGRAM_TOKEN) {
  log.error('Missing TELEGRAM_TOKEN. Set it in Render Variables.');
  process.exit(1);
}
if (!OPENROUTER_API_KEY) {
  log.error('Missing OPENROUTER_API_KEY. Set it in Render Variables.');
  process.exit(1);
}

// Long-polling bot (no webhook / HTTPS required)
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

async function askOpenRouter(userText) {
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const headers = {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    // Optional but helpful:
    'HTTP-Referer': 'https://github.com/',
    'X-Title': 'OpenRouter Telegram Bot'
  };

  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userText }
    ],
    temperature: 0.7
  };

  const resp = await axios.post(url, payload, { headers, timeout: 60000 });
  const content = resp?.data?.choices?.[0]?.message?.content;
  if (!content) return 'Ошибка: пустой ответ от модели.';
  return String(content).trim();
}

bot.onText(/^\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId,
    'Привет! Напиши вопрос — я отвечу через OpenRouter.\n' +
    'Команды:\n' +
    '/start — помощь\n' +
    '/ping — проверка\n'
  );
});

bot.onText(/^\/ping/, async (msg) => {
  await bot.sendMessage(msg.chat.id, 'pong ✅');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // ignore commands (already handled)
  if (!text || text.startsWith('/')) return;

  // basic length guard
  if (text.length > 4000) {
    await bot.sendMessage(chatId, 'Сообщение слишком длинное. Пришли короче 🙏');
    return;
  }

  // show typing
  bot.sendChatAction(chatId, 'typing').catch(() => {});

  try {
    const answer = await askOpenRouter(text);
    const safe = answer.length > 4000 ? answer.slice(0, 4000) : answer;
    await bot.sendMessage(chatId, safe);
  } catch (err) {
    log.error({ err }, 'OpenRouter request failed');
    await bot.sendMessage(chatId, 'Упс, ошибка при обращении к OpenRouter 😢');
  }
});

bot.on('polling_error', (err) => {
  log.error({ err }, 'Polling error');
});

log.info({ model: MODEL }, 'Bot started (polling)');
