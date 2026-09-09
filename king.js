let chatName = 'King';

function showSection(sectionId) {
  const sections = ['mainMenu', 'capacidadesMenu', 'horariosMenu', 'metodosMenu', 'financasMenu', 'autoconfiancaMenu'];
  sections.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.toggle('hidden', id !== sectionId);
    }
  });
}

function showCapacidades() {
  showSection('capacidadesMenu');
}

function voltarMenu() {
  showSection('mainMenu');
}

function voltarCapacidades() {
  showSection('capacidadesMenu');
}

function showHorarios() {
  showSection('horariosMenu');
}

function showMetodos() {
  showSection('metodosMenu');
}

function showFinancas() {
  showSection('financasMenu');
  const conteudo = document.getElementById('financasConteudo');
  if (conteudo) {
    conteudo.innerHTML = `
      <h3>Educação Financeira</h3>
      <p><strong>O que é:</strong> controlar o dinheiro, gastar menos do que ganha e investir com planejamento.</p>
      <p><strong>Regras básicas:</strong> pagar primeiro as necessidades, criar reserva de emergência e evitar dívidas caras.</p>
      <p><strong>Objetivo:</strong> transformar gastos impulsivos em hábitos inteligentes e construir liberdade financeira.</p>
    `;
  }
}

function showAutoconfianca() {
  showSection('autoconfiancaMenu');
  const conteudo = document.getElementById('autoconfiancaConteudo');
  if (conteudo) {
    conteudo.innerHTML = `
      <h3>Autoconfiança e Autodisciplina</h3>
      <p>Progresso diário vence motivação momentânea.</p>
      <p>Defina metas pequenas, revise seu desempenho e trate erros como parte do processo.</p>
      <p>Estudar com rotina, foco e consistência fortalece confiança e disciplina.</p>
    `;
  }
}

function alterarNome() {
  const novoNome = prompt('Digite o novo nome:', chatName);
  if (novoNome && novoNome.trim() !== '') {
    chatName = novoNome.trim();
    const nomeElemento = document.getElementById('chatName');
    if (nomeElemento) {
      nomeElemento.textContent = chatName;
    }
  }
}

function gerarHorario() {
  const periodo = document.getElementById('periodoInput').value.toLowerCase().trim();
  const resultado = document.getElementById('horarioResultado');

  const mapa = {
    manha: 'Estudar das 9h às 11h: 9:00-9:10 organização, 9:10-9:40 estudo principal, 9:40-9:45 pausa, 9:45-10:25 prática, 10:25-10:30 pausa, 10:30-10:55 revisão.',
    tarde: 'Estudar das 16h às 18h: 16:00-16:10 preparação, 16:10-16:50 estudo, 16:50-17:00 pausa, 17:00-17:40 prática, 17:40-17:55 revisão, 17:55-18:00 fechamento.',
    noite: 'Estudar das 20h às 22h: 20:00-20:20 revisão, 20:20-20:50 foco, 20:50-21:20 exercícios, 21:20-21:50 resumos, 21:50-22:00 planejamento.'
  };

  if (resultado) {
    resultado.innerHTML = mapa[periodo] || 'Período inválido. Tente: manhã, tarde ou noite.';
  }
}

function mostrarMetodo(numero) {
  const resultado = document.getElementById('metodoResultado');
  const metodos = {
    1: 'Pomodoro: estude por 25 minutos e descanse 5 minutos para manter foco sem cansaço.',
    2: 'Feynman: explique o tema como se estivesse ensinando a uma criança para entender de verdade.',
    3: 'Active Recall: leia, feche o material e tente lembrar sem olhar. Isso fortalece a memória.',
    4: 'Spaced Repetition: revise em intervalos crescentes, como 1, 3, 6 e 12 dias.',
    5: 'Interleaving: misture assuntos diferentes em uma mesma sessão para melhorar comparação e raciocínio.'
  };

  if (resultado) {
    resultado.innerHTML = metodos[numero] || 'Opção inválida. Escolha um método válido.';
  }
}

function configurarCadastro() {
  const form = document.getElementById('cadastroForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const dados = {
      nome: document.getElementById('nome').value.trim(),
      email: document.getElementById('email').value.trim(),
      telefone: document.getElementById('telefone').value.trim(),
      interesse: document.getElementById('interesse').value
    };

    const mensagemDiv = document.getElementById('cadastroMensagem');
    if (!mensagemDiv) return;

    mensagemDiv.innerHTML = 'Enviando...';
    mensagemDiv.className = 'mensagem';

    try {
      const resposta = await fetch('/formcadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      const data = await resposta.json();

      if (resposta.ok) {
        mensagemDiv.innerHTML = 'Cadastro realizado com sucesso!';
        mensagemDiv.className = 'mensagem sucesso';
        form.reset();
      } else {
        mensagemDiv.innerHTML = data.error || 'Erro ao cadastrar.';
        mensagemDiv.className = 'mensagem erro';
      }
    } catch (erro) {
      mensagemDiv.innerHTML = 'Erro ao conectar com o servidor.';
      mensagemDiv.className = 'mensagem erro';
      console.error('Erro no cadastro:', erro);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('chatName')) {
    document.getElementById('chatName').textContent = chatName;
  }
  configurarCadastro();
});