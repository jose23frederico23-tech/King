// Servidor Node.js do King e integração privada com a API Gemini.
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { GoogleGenAI } = require('@google/genai');

const ROOT = __dirname;
const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_HISTORY_MESSAGES = 21;
const MAX_HISTORY_CHARACTERS = 48_000;
const MAX_QUESTION_LENGTH = 4_000;
const DEFAULT_ALLOWED_ORIGINS = [
  'https://king-silk-six.vercel.app',
  'http://127.0.0.1:3000',
  'http://localhost:3000'
];

const INSTRUCAO_KING =
  'O teu nome é King. És um amigo próximo e simpático que ajuda a aprender, crescer e, se for necessário, contrariar as ideias do utilizador. ' +
  'Responde a perguntas para aumentar o conhecimento e dá conselhos úteis quando fizer sentido. ' +
  'Mantém um tom natural, leve, respeitoso e atual. ' +
  'Usa o histórico da conversa: constrói cada resposta com base nas perguntas anteriores. ' +
  'Não fales como um professor distante nem como uma pessoa velha a dar sermões. ' +
  'Se a pergunta não tiver relação com aprender, conhecer algo ou receber conselhos, ' +
  'não a respondas: diz numa mensagem curta que só podes falar sobre esses temas e orienta a conversa de volta a eles.';

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const entry = line.trim();
    if (!entry || entry.startsWith('#')) continue;

    const separator = entry.indexOf('=');
    if (separator < 1) continue;

    const name = entry.slice(0, separator).trim();
    let value = entry.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[name] === undefined) process.env[name] = value;
  }
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(data));
}

function getAllowedOrigins() {
  const configuredOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]);
}

function applyCors(request, response, allowedOrigins) {
  const origin = request.headers.origin;
  response.setHeader('Vary', 'Origin');

  if (!origin) return true;
  if (!allowedOrigins.has(origin)) {
    sendJson(response, 403, { error: 'Origem não autorizada.' });
    return false;
  }

  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Max-Age', '600');
  return true;
}

function readJsonRequest(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let tooLarge = false;

    request.on('data', (chunk) => {
      if (tooLarge) return;
      totalBytes += chunk.length;
      if (totalBytes > MAX_REQUEST_BYTES) {
        tooLarge = true;
        reject(Object.assign(new Error('O pedido é demasiado grande.'), { statusCode: 413 }));
        request.resume();
        return;
      }
      chunks.push(chunk);
    });

    request.on('end', () => {
      if (totalBytes > MAX_REQUEST_BYTES) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('O corpo do pedido deve ser JSON válido.'), { statusCode: 400 }));
      }
    });

    request.on('error', reject);
  });
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: 'Escreva uma pergunta antes de enviar.' };
  }
  if (messages.length > MAX_HISTORY_MESSAGES) {
    return { error: 'O histórico da conversa é demasiado longo.' };
  }

  let totalCharacters = 0;
  const contents = [];
  for (const [index, message] of messages.entries()) {
    const expectedRole = index % 2 === 0 ? 'user' : 'model';
    if (
      !message ||
      typeof message !== 'object' ||
      message.role !== expectedRole ||
      typeof message.text !== 'string' ||
      !message.text.trim()
    ) {
      return { error: 'O histórico da conversa é inválido.' };
    }
    if (message.role === 'user' && message.text.length > MAX_QUESTION_LENGTH) {
      return { error: `A pergunta deve ter até ${MAX_QUESTION_LENGTH} caracteres.` };
    }

    totalCharacters += message.text.length;
    if (totalCharacters > MAX_HISTORY_CHARACTERS) {
      return { error: 'O histórico da conversa é demasiado longo.' };
    }
    contents.push({ role: message.role, parts: [{ text: message.text }] });
  }

  if (messages[messages.length - 1].role !== 'user') {
    return { error: 'A última mensagem deve ser uma pergunta.' };
  }

  return { contents };
}

async function handleChat(request, response, client, model) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { error: 'Método não permitido.' });
    return;
  }

  let data;
  try {
    data = await readJsonRequest(request);
  } catch (error) {
    sendJson(response, error.statusCode || 400, { error: error.message || 'Pedido inválido.' });
    return;
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    sendJson(response, 400, { error: 'O pedido JSON é inválido.' });
    return;
  }

  const validation = validateMessages(data.messages);
  if (validation.error) {
    sendJson(response, 400, { error: validation.error });
    return;
  }

  try {
    const result = await client.models.generateContent({
      model,
      contents: validation.contents,
      config: { systemInstruction: INSTRUCAO_KING }
    });
    const answer = typeof result.text === 'string' ? result.text.trim() : '';
    if (!answer) {
      sendJson(response, 502, { error: 'O Gemini não devolveu texto. Reformule a pergunta e tente novamente.' });
      return;
    }
    sendJson(response, 200, { answer });
  } catch (error) {
    console.error('Falha ao contactar o Gemini:', error?.message || error);
    sendJson(response, 502, {
      error: error?.status === 429 || error?.statusCode === 429
        ? 'O limite de pedidos do Gemini foi atingido. Tente novamente mais tarde.'
        : 'O Gemini não conseguiu responder. Verifique a chave e tente novamente.'
    });
  }
}

function serveStatic(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Método não permitido.');
    return;
  }

  let pathname;
  try {
    pathname = new URL(request.url, 'http://localhost').pathname;
  } catch {
    response.writeHead(400);
    response.end('Pedido inválido.');
    return;
  }

  const files = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/index.html': ['index.html', 'text/html; charset=utf-8'],
    '/king.js': ['king.js', 'text/javascript; charset=utf-8'],
    '/king.css': ['king.css', 'text/css; charset=utf-8']
  };
  const file = files[pathname];
  if (!file) {
    response.writeHead(404);
    response.end('Não encontrado.');
    return;
  }

  fs.readFile(path.join(ROOT, file[0]), (error, contents) => {
    if (error) {
      console.error(`Falha ao ler ${file[0]}:`, error.message);
      response.writeHead(500);
      response.end('Erro ao servir a página.');
      return;
    }

    response.writeHead(200, {
      'Content-Type': file[1],
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache'
    });
    response.end(request.method === 'HEAD' ? undefined : contents);
  });
}

function iniciarServidor() {
  loadEnvFile();

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Erro: defina GEMINI_API_KEY no arquivo .env.');
  }
  const model = (process.env.GEMINI_MODEL || 'gemini-3.8-flash').trim();
  if (!model) {
    throw new Error('Erro: GEMINI_MODEL não pode ficar vazio.');
  }

  const client = new GoogleGenAI({ apiKey });
  const port = Number(process.env.PORT) || 3000;
  const allowedOrigins = getAllowedOrigins();
  const server = http.createServer((request, response) => {
    let pathname;
    try {
      pathname = new URL(request.url, 'http://localhost').pathname;
    } catch {
      response.writeHead(400);
      response.end('Pedido inválido.');
      return;
    }

    if (pathname === '/health') {
      sendJson(response, 200, { status: 'ok' });
      return;
    }

    if (pathname === '/api/chat') {
      if (!applyCors(request, response, allowedOrigins)) return;
      if (request.method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
      }
      if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS');
        sendJson(response, 405, { error: 'Método não permitido.' });
        return;
      }
      handleChat(request, response, client, model).catch((error) => {
        console.error('Erro inesperado na rota de chat:', error?.message || error);
        if (!response.headersSent) {
          sendJson(response, 500, { error: 'Ocorreu um erro interno no servidor.' });
        }
      });
      return;
    }
    if (process.env.SERVE_STATIC === 'true') {
      serveStatic(request, response);
      return;
    }
    response.writeHead(404);
    response.end('Não encontrado.');
  });

  server.on('error', (error) => {
    console.error('Não foi possível iniciar o servidor:', error.message);
    process.exitCode = 1;
  });
  server.listen(port, '0.0.0.0', () => {
    console.log(`API King ativa na porta ${port}`);
  });

  return server;
}

module.exports = { iniciarServidor, validateMessages };

if (require.main === module) {
  try {
    iniciarServidor();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
