# King

Assistente de estudos com frontend estático e integração privada com a Groq.

## Arquitetura principal

- `index.html`, `disgner/king.css` e `backend/king.js`: frontend.
- `api/chat.js`: função serverless `POST /api/chat` da Vercel.
- `backend/king-ia.js`: servidor Node legado para execução autónoma/Render; não é necessário no deploy Vercel.
- `py_modules/` e outros recursos legados são independentes da aplicação principal.

A chave da Groq é lida apenas no servidor através de `GROQ_API_KEY`. Nunca a coloques no frontend, no Git ou em registos.

## Executar localmente na Vercel

1. Instala Node.js 20 ou superior e executa `npm install`.
2. Adiciona `GROQ_API_KEY` e, opcionalmente, `GROQ_MODEL` ao `.env.local`. Este ficheiro é ignorado pelo Git; mantém as outras variáveis locais que já existam.
3. Executa `vercel dev` diretamente no terminal. Não existe script `dev` que invoque a Vercel recursivamente.
4. Abre o endereço local indicado pela CLI. A API fica disponível em `/api/chat`.

No projeto Vercel, configura `GROQ_API_KEY` nos ambientes Production, Preview e Development. O modelo predefinido é `openai/gpt-oss-20b`.

## Publicar na Vercel

Liga o repositório ao projeto Vercel ou usa a CLI autenticada e ligada ao projeto. A pasta `api/` é detetada automaticamente como funções serverless; não é necessário um `vercel.json` para este layout. Depois de rever as alterações, publica pela integração GitHub/Vercel ou executa `vercel --prod`.

## Servidor legado opcional

`npm start` inicia `backend/king-ia.js` para compatibilidade com o serviço Render definido em `render.yaml`. Esse servidor requer `GROQ_API_KEY`; não é o backend usado pela Vercel. Define a variável de ambiente no serviço Render, nunca no código.
