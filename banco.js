const express = require('express');
const cors = require('cors');
const path = require('path');

const { saveCadastro } = require('./banco.js'); // teu banco
const { sendWhatsAppNotification } = require('./whats.js'); // opcional

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'king.html'));
});

// Rota de cadastro
app.post('/formcadastro', async (req, res) => {
  try {
    const { nome, email, telefone, interesse } = req.body;

    // Validação
    if (!nome || !email || !interesse) {
      return res.status(400).json({
        error: 'Nome, email e interesse são obrigatórios'
      });
    }

    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }

    // Salvar no banco
    const cadastro = await saveCadastro({
      nome,
      email,
      telefone,
      interesse
    });

    // Enviar WhatsApp (opcional)
    try {
      await sendWhatsAppNotification(
        `Novo cadastro: ${nome} - ${email}`
      );
    } catch (err) {
      console.log('WhatsApp não enviado (ok continuar)');
    }

    // Resposta de sucesso
    res.status(201).json({
      message: 'Cadastro realizado com sucesso!',
      cadastro
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Porta
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});