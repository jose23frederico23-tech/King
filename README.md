# King

## Publicar o frontend no Vercel e a API no Render

1. O projeto frontend pode continuar ligado ao GitHub e publicado em `https://king-silk-six.vercel.app/`.
2. No Render, cria um **Blueprint** a partir deste repositório e confirma o serviço descrito em `render.yaml`.
3. No serviço Render, define `GEMINI_API_KEY` com uma chave nova do Google AI Studio. Não a coloques no GitHub.
4. Faz deploy no Render para aplicar a origem CORS Vercel e abre o site no Vercel.

`king.js` envia o chat para `https://king-gemini-api.onrender.com/api/chat`. O backend Node escuta na porta do Render, permite CORS para o domínio Vercel de produção definido e chama o Gemini usando o segredo guardado no Render. O endpoint `/health` é usado pelo Render para verificar o serviço.

Para executar localmente, cria `.env` a partir de `.env.example`, configura uma chave de desenvolvimento e executa `npm start`. `SERVE_STATIC=true` serve os ficheiros locais, e o frontend usa `/api/chat` no servidor local.

Revoga a chave Gemini que foi partilhada anteriormente e cria uma nova. O `.env` está excluído do Git; nunca coloques uma chave em `king.js`, `index.html` ou num commit.

O serviço gratuito do Render pode suspender-se quando não é usado e demorar alguns segundos a responder ao primeiro pedido. CORS permite ao site chamar a API a partir do domínio configurado, mas não impede clientes não-browser de chamar o endpoint; acompanha o uso e a quota da chave Gemini.
