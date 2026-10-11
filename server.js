const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const MAX_REQUEST_BYTES = 16 * 1024;
const MAX_QUESTION_LENGTH = 4000;

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const entry = line.trim();
    if (!entry || entry.startsWith('#')) {
      continue;
    }

    const separator = entry.indexOf('=');
    if (separator < 1) {
      continue;
    }

    const name = entry.slice(0, separator).trim();
    let value = entry.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[name] === undefined) {
      process.env[name] = value;
    }
  }
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(data));
}

function readJsonRequest(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let tooLarge = false;

    request.on('data', (chunk) => {
      if (tooLarge) {
        return;
      }
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > MAX_REQUEST_BYTES) {
        tooLarge = true;
        reject(Object.assign(new Error('O pedido é demasiado grande.'), { statusCode: 413 }));
      }
    });

    request.on('end', () => {
      if (tooLarge) {
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error('O corpo do pedido deve ser JSON válido.'), { statusCode: 400 }));
      }
    });

    request.on('error', reject);
  });
}

async function handleChat(request, response) {
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

  const question = data && typeof data.pergunta === 'string' ? data.pergunta.trim() : '';
  if (!question || question.length > MAX_QUESTION_LENGTH) {
    sendJson(response, 400, {
      error: `Escreva uma pergunta com até ${MAX_QUESTION_LENGTH} caracteres.`
    });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    sendJson(response, 503, { error: 'A chave do Gemini não está configurada no servidor.' });
    return;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let geminiResponse;
  try {
    geminiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: 'És o King, um assistente de estudos. Responde em português claro, de forma útil, paciente e adequada a estudantes. Explica passo a passo quando necessário e ajuda o estudante a aprender, sem inventar certezas.'
          }]
        },
        contents: [{ parts: [{ text: question }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
      })
    });
  } catch (error) {
    console.error('Falha ao contactar o Gemini:', error.message);
    sendJson(response, 502, { error: 'Não foi possível contactar o Gemini. Tente novamente.' });
    return;
  }

  let geminiData;
  try {
    geminiData = await geminiResponse.json();
  } catch {
    console.error('O Gemini devolveu uma resposta que não é JSON válido.');
    sendJson(response, 502, { error: 'O Gemini devolveu uma resposta inválida.' });
    return;
  }

  if (!geminiResponse.ok) {
    console.error(`O Gemini respondeu com o estado HTTP ${geminiResponse.status}.`);
    const statusCode = geminiResponse.status === 429 ? 503 : 502;
    sendJson(response, statusCode, {
      error: geminiResponse.status === 429
        ? 'O limite de pedidos do Gemini foi atingido. Tente novamente mais tarde.'
        : 'O Gemini não conseguiu responder. Verifique a chave e tente novamente.'
    });
    return;
  }

  const answer = geminiData.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!answer) {
    sendJson(response, 502, { error: 'O Gemini não devolveu texto. Reformule a pergunta e tente novamente.' });
    return;
  }

  sendJson(response, 200, { answer });
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

  const filePath = path.join(ROOT, file[0]);
  fs.readFile(filePath, (error, contents) => {
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

loadEnvFile();

const port = Number(process.env.PORT) || 3000;
const server = http.createServer((request, response) => {
  if (request.url === '/api/chat') {
    handleChat(request, response).catch((error) => {
      console.error('Erro inesperado na rota de chat:', error.message);
      if (!response.headersSent) {
        sendJson(response, 500, { error: 'Ocorreu um erro interno no servidor.' });
      }
    });
    return;
  }

  serveStatic(request, response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`King disponível em http://127.0.0.1:${port}`);
});
