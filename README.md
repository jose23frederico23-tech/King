# King

## Executar o assistente

1. Instale o Node.js 18 ou superior.
2. Crie uma nova chave da API Gemini no Google AI Studio. Não reutilize uma chave partilhada em mensagens.
3. Coloque a chave em `GEMINI_API_KEY` no arquivo `.env` na raiz do projeto.
4. Execute `npm start` e abra http://127.0.0.1:3000.

A chave fica apenas no servidor Node e não é enviada ao navegador. O arquivo `.env` está excluído do Git; use `.env.example` como referência.
