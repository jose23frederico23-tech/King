# King

## Publicar o frontend no Vercel e a API no Render

1. Confirma que `SQL/king-ia.js` e `SQL/king.js` aparecem no Git; os restantes ficheiros de `SQL/` continuam ignorados.
2. No Render, cria um **Blueprint** a partir deste repositório e seleciona o `render.yaml` na raiz.
3. No serviço Render, define `GROQ_API_KEY` com a tua chave da Groq. Não a coloques no GitHub.
4. O serviço usa o modelo `openai/gpt-oss-20b` por padrão de deploy. O frontend aponta para `https://king-gemini-api.onrender.com/api/chat`, e o CORS permite `https://king-silk-six.vercel.app`.
5. Faz deploy do serviço no Render e confirma que `/health` responde `{"status":"ok"}`. Depois publica o frontend no Vercel.

O `package.json` da raiz inicia o backend Node em `SQL/king-ia.js`; o Render fornece a porta através de `PORT`. A chave Groq é configurada como variável secreta no Render, nunca no código.

Para executar localmente, configura `GROQ_API_KEY` e `GROQ_MODEL` no `.env` e executa `npm start`. O frontend local usa `/api/chat`.

O `.env` está excluído do Git; nunca coloques a chave da Groq em `king.js`, `index.html` ou num commit.

O serviço gratuito do Render pode suspender-se quando não é usado e demorar alguns segundos a responder ao primeiro pedido. CORS permite ao site chamar a API a partir do domínio configurado, mas não impede clientes não-browser de chamar o endpoint; acompanha o uso e a quota da chave Groq.
