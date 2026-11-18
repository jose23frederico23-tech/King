
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_HISTORY_MESSAGES = 21;
const MAX_HISTORY_CHARACTERS = 48000;
const MAX_QUESTION_LENGTH = 4000;

const INSTRUCAO_KING =
  'O teu nome é King. És desenvolvido pelo programador José Armindo Frederico, dono da JAF Solution. ' +
  'És um amigo próximo e simpático que ajuda a aprender, crescer e, se necessário, contrariar as ideias do utilizador. ' +
  'Responde a perguntas para aumentar o conhecimento e dá conselhos úteis quando fizer sentido. ' +
  'Mantém um tom natural, leve, respeitoso e atual. ' +
  'Usa o histórico da conversa para construir cada resposta com base nas perguntas anteriores. ' +
  'Não fales como um professor distante nem como uma pessoa velha a dar sermões. ' +
  'Se a pergunta não tiver relação com aprender, conhecer algo ou receber conselhos, ' +
  'explica brevemente que só podes falar sobre esses temas e orienta a conversa de volta a eles.';

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: 'Escreva uma pergunta antes de enviar.' };
  }

  if (messages.length > MAX_HISTORY_MESSAGES) {
    return { error: 'O histórico da conversa é demasiado longo.' };
  }

  let totalCharacters = 0;
  const contents = [];

  for (const message of messages) {
    const role = message?.role === 'model'
      ? 'assistant'
      : message?.role;

    const content = typeof message?.content === 'string'
      ? message.content
      : message?.text;

    if (
      !message ||
      typeof message !== 'object' ||
      !['user', 'assistant'].includes(role) ||
      typeof content !== 'string' ||
      !content.trim()
    ) {
      return { error: 'O histórico da conversa é inválido.' };
    }

    if (role === 'user' && content.length > MAX_QUESTION_LENGTH) {
      return {
        error: `A pergunta deve ter até ${MAX_QUESTION_LENGTH} caracteres.`
      };
    }

    totalCharacters += content.length;

    if (totalCharacters > MAX_HISTORY_CHARACTERS) {
      return { error: 'O histórico da conversa é demasiado longo.' };
    }

    contents.push({ role, content });
  }

  if (contents[0].role === 'assistant') {
    contents.shift();
  }

  if (!contents.length || contents[contents.length - 1].role !== 'user') {
    return { error: 'A última mensagem deve ser uma pergunta.' };
  }

  return { messages: contents };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: 'Método não permitido.'
    });
  }

  let data = req.body;

  if (typeof data === 'string') {
    if (Buffer.byteLength(data, 'utf8') > MAX_REQUEST_BYTES) {
      return res.status(413).json({
        error: 'O pedido é demasiado grande.'
      });
    }

    try {
      data = JSON.parse(data);
    } catch {
      return res.status(400).json({
        error: 'O corpo do pedido deve ser JSON válido.'
      });
    }
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({
      error: 'O pedido JSON é inválido.'
    });
  }

  if (Buffer.byteLength(JSON.stringify(data), 'utf8') > MAX_REQUEST_BYTES) {
    return res.status(413).json({
      error: 'O pedido é demasiado grande.'
    });
  }

  const validation = validateMessages(data.messages);

  if (validation.error) {
    return res.status(400).json({
      error: validation.error
    });
  }

  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  const model = (process.env.GROQ_MODEL || 'openai/gpt-oss-20b').trim();

  if (!apiKey) {
    console.error('GROQ_API_KEY não está configurada.');
    return res.status(500).json({
      error: 'O serviço do King não está configurado corretamente.'
    });
  }

  if (!model) {
    return res.status(500).json({
      error: 'O modelo de inteligência artificial não está configurado.'
    });
  }

  try {
    const result = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: INSTRUCAO_KING },
          ...validation.messages
        ]
      })
    });

    if (!result.ok) {
      console.error('A Groq respondeu com erro HTTP:', result.status);

      if (result.status === 429) {
        return res.status(429).json({
          error: 'O limite de pedidos da Groq foi atingido. Tente novamente mais tarde.'
        });
      }

      if (result.status === 401) {
        return res.status(500).json({
          error: 'A autenticação com a Groq falhou. Verifique a variável GROQ_API_KEY.'
        });
      }

      return res.status(502).json({
        error: 'A Groq não conseguiu responder. Verifique a configuração e tente novamente.'
      });
    }

    const responseData = await result.json();
    const content = responseData?.choices?.[0]?.message?.content;
    const answer = typeof content === 'string' ? content.trim() : '';

    if (!answer) {
      return res.status(502).json({
        error: 'O King não devolveu texto. Reformule a pergunta e tente novamente.'
      });
    }

    return res.status(200).json({ answer });

  } catch (error) {
    console.error('Falha ao contactar a Groq:', error?.message || error);

    return res.status(502).json({
      error: 'Não foi possível contactar a inteligência artificial. Tente novamente.'
    });
  }
};
