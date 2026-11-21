let chatName = 'King';
let historicoIA = [];
let versaoConversa = 0;
const API_CHAT_URL ='/api/chat';

function showSection(sectionId) {
  const sections = ['mainMenu', 'capacidadesMenu', 'horariosMenu', 'metodosMenu', 'financasMenu', 'autoconfiancaMenu'];
  sections.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.toggle('hidden', id !== sectionId);
    }
  });
  document.getElementById('chatView')?.classList.add('hidden');
  document.getElementById('toolWorkspace')?.classList.remove('hidden');
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
  const periodo = document.getElementById('periodoInput').value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const resultado = document.getElementById('horarioResultado');

  const mapa = {
    manha: 'Estudar das 9h às 11h : <br> 1º - 9:00-9:10 Organização dos materias. <br> 2º - 9:10-9:40 estudar os temas  principais ou o que tens mais dificuldade. <br>3º - 9:40-9:45 pausa de 5 minutos. <br> 9:45-10:25 práticar os temas estudados. <br> 4º - 10:25-10:30 pausa novamente para o descanso. <br> 5º - 10:30-10:55 revisão para finalizar.',
    tarde: 'Estudar das 16h às 18h : <br> 1º -16:00-16:10 Preparação do conteudo. <br> 2º - 16:10-16:50 estudar os temas com maior dificuldade. <br> 3º - 16:50-17:00 pausa os estudos por 5 minutos. <br> 4º - 17:00-17:40 práticar o que estudaste. <br> 5º - 17:40-17:55 revisão final dos conteudos.<br> 17:55-18:00 fechamento dos estudos.',
    noite: 'Estudar das 20h às 22h: 20:00-20:20 revisão, 20:20-20:50 foco, 20:50-21:20 exercícios, 21:20-21:50 resumos, 21:50-22:00 planejamento.'
  };

  if (resultado) {
    resultado.innerHTML = Object.hasOwn(mapa, periodo)
      ? mapa[periodo]
      : 'Período inválido. Tente: manhã, tarde ou noite.';
  }
}

function mostrarIndicadorEspera(resposta) {
  const indicador = document.createElement('span');
  indicador.className = 'ia-loading';
  indicador.setAttribute('role', 'status');

  const texto = document.createElement('span');
  texto.textContent = 'O King está a pensar';

  const pontos = document.createElement('span');
  pontos.className = 'ia-loading-dots';
  pontos.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 3; i += 1) {
    pontos.append(document.createElement('span'));
  }

  indicador.append(texto, pontos);
  resposta.replaceChildren(indicador);
}

function criarMensagem(tipo) {
  const mensagem = document.createElement('article');
  mensagem.className = `message message-${tipo}`;

  const avatar = document.createElement('span');
  avatar.className = 'message-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = tipo === 'assistant' ? 'K' : 'Tu';

  const corpo = document.createElement('div');
  corpo.className = 'message-body';
  const identificacao = document.createElement('div');
  identificacao.className = 'message-heading';
  identificacao.textContent = tipo === 'assistant' ? 'King' : 'Tu';

  const texto = document.createElement('div');
  texto.className = 'message-content';
  corpo.append(identificacao, texto);
  mensagem.append(avatar, corpo);
  return { mensagem, corpo, texto };
}

function acrescentarTextoSimples(elemento, texto) {
  if (!texto) {
    return;
  }

  texto.split(/(`[^`\n]+`)/g).forEach((parte) => {
    if (parte.startsWith('`') && parte.endsWith('`')) {
      const codigo = document.createElement('code');
      codigo.textContent = parte.slice(1, -1);
      elemento.append(codigo);
    } else {
      elemento.append(document.createTextNode(parte));
    }
  });
}

function acrescentarTextoFormatado(elemento, texto) {
  const partesCodigo = /```([^\n`]*)\n([\s\S]*?)```/g;
  let inicio = 0;
  let correspondencia;

  while ((correspondencia = partesCodigo.exec(texto)) !== null) {
    acrescentarTextoSimples(elemento, texto.slice(inicio, correspondencia.index));
    const bloco = document.createElement('pre');
    const codigo = document.createElement('code');
    codigo.textContent = correspondencia[2].replace(/\n$/, '');
    bloco.append(codigo);
    elemento.append(bloco);
    inicio = partesCodigo.lastIndex;
  }

  acrescentarTextoSimples(elemento, texto.slice(inicio));
}

function acrescentarAcoes(corpo, resposta) {
  const acoes = document.createElement('div');
  acoes.className = 'message-actions';
  acoes.innerHTML = `
    <button class="message-action" type="button" data-action="copy" aria-label="Copiar resposta">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg><span>Copiar</span>
    </button>
    <button class="message-action" type="button" data-action="repeat" aria-label="Repetir resposta, demonstração visual">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 17 6l3 6M4 12l3 6a7 7 0 0 0 11.4-3"/></svg><span>Repetir</span>
    </button>
    <button class="message-action" type="button" data-action="rate" aria-label="Avaliar resposta" aria-pressed="false">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zm0 0 5-8a3 3 0 0 1 2 3l-1 5h6a2 2 0 0 1 2 2l-1 7a2 2 0 0 1-2 2H7"/></svg><span>Avaliar</span>
    </button>`;
  acoes.dataset.answer = resposta;
  corpo.append(acoes);
}

function mostrarConversa() {
  document.getElementById('welcomeScreen')?.classList.add('hidden');
  document.getElementById('conversation')?.classList.remove('hidden');
  document.getElementById('chatView')?.classList.remove('hidden');
  document.getElementById('toolWorkspace')?.classList.add('hidden');
}

function ajustarCampo(campoPergunta) {
  campoPergunta.style.height = 'auto';
  campoPergunta.style.height = `${Math.min(campoPergunta.scrollHeight, 180)}px`;
}

async function copiarTexto(texto, botao) {
  try {
    await navigator.clipboard.writeText(texto);
    botao.querySelector('span').textContent = 'Copiado';
  } catch {
    botao.querySelector('span').textContent = 'Não foi possível copiar';
  }
}

async function responderIA() {
  const campoPergunta = document.getElementById('perguntaIA');
  const resposta = document.getElementById('respostaIA');
  const botao = document.getElementById('btn-IA');

  if (!campoPergunta || !resposta) {
    return;
  }
  if (botao?.disabled) {
    return;
  }

  const pergunta = campoPergunta.value.trim();

  if (!pergunta) {
    campoPergunta.focus();
    return;
  }

  const versaoAtual = versaoConversa;
  if (botao) {
    botao.disabled = true;
  }
  mostrarConversa();
  const mensagensUI = document.getElementById('respostaIA');
  const mensagemUtilizador = criarMensagem('user');
  mensagemUtilizador.texto.textContent = pergunta;
  mensagensUI.append(mensagemUtilizador.mensagem);
  const mensagemKing = criarMensagem('assistant');
  mensagensUI.append(mensagemKing.mensagem);
  mostrarIndicadorEspera(mensagemKing.texto);
  const chatStage = document.getElementById('chatStage');
  chatStage?.scrollTo({ top: chatStage.scrollHeight, behavior: 'smooth' });
  campoPergunta.value = '';
  ajustarCampo(campoPergunta);

  try {
    const mensagens = [
      ...historicoIA,
      { role: 'user', content: pergunta }
    ];
    const requisicao = await fetch(API_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: mensagens })
    });
    let dados;
    try {
      dados = await requisicao.json();
    } catch {
      throw new Error('O servidor não devolveu uma resposta válida. Inicie a aplicação com npm start.');
    }
    if (versaoAtual !== versaoConversa) {
      return;
    }
    if (!requisicao.ok) {
      throw new Error(dados.error || 'Não foi possível obter uma resposta.');
    }
    if (typeof dados.answer !== 'string' || !dados.answer.trim()) {
      throw new Error('O servidor devolveu uma resposta vazia.');
    }

    acrescentarTextoFormatado(mensagemKing.texto, dados.answer);
    acrescentarAcoes(mensagemKing.corpo, dados.answer);
    historicoIA = [
      ...mensagens,
      { role: 'assistant', content: dados.answer }
    ].slice(-20);
  } catch (erro) {
    if (versaoAtual !== versaoConversa) {
      return;
    }
    const mensagem = erro instanceof TypeError
      ? 'Não foi possível contactar a API King. Confirme que o servidor está em execução e tente novamente.'
      : erro.message || 'Ocorreu um erro ao enviar a pergunta.';
    mensagemKing.mensagem.classList.add('message-error');
    mensagemKing.texto.textContent = mensagem;
  } finally {
    if (botao && versaoAtual === versaoConversa) {
      botao.disabled = false;
    }
    if (versaoAtual === versaoConversa) {
      chatStage?.scrollTo({ top: chatStage.scrollHeight, behavior: 'smooth' });
    }
  }
}

function mostrarMetodo(numero) {
  const resultado = document.getElementById('metodoResultado');
  const metodos = {
    1: 'Pomodoro: <br> Estude por 25 minutos e descanse 5 minutos para manter foco sem cansaço.',
    2: 'Feynman: <br> Explique o tema como se estivesse ensinando a uma criança para entender de verdade.',
    3: 'Active Recall: <br> Leia, feche o material e tente lembrar sem olhar. Isso fortalece a memória.',
    4: 'Spaced Repetition:<br> Revise em intervalos crescentes, como 1, 3, 6 e 12 dias de pausas controladas.',
    5: 'Interleaving:<br> Misture assuntos diferentes em uma mesma sessão para melhorar comparação e raciocínio.'
  };

  if (resultado) {
    resultado.innerHTML = metodos[numero] || 'Opção inválida. Escolha um método válido.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('chatName')) {
    document.getElementById('chatName').textContent = chatName;
  }

  const campoPergunta = document.getElementById('perguntaIA');
  if (campoPergunta) {
    campoPergunta.addEventListener('input', () => ajustarCampo(campoPergunta));
    campoPergunta.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        responderIA();
      }
    });
  }

  document.getElementById('composerForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    responderIA();
  });

  const appShell = document.getElementById('appShell');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('appSidebar');
  const fecharMenu = () => {
    appShell?.classList.remove('sidebar-open');
    sidebar?.setAttribute('aria-hidden', 'true');
    if (sidebar) {
      sidebar.inert = true;
    }
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Abrir menu');
  };
  const abrirMenu = () => {
    appShell?.classList.add('sidebar-open');
    sidebar?.setAttribute('aria-hidden', 'false');
    if (sidebar) {
      sidebar.inert = false;
    }
    menuToggle?.setAttribute('aria-expanded', 'true');
    menuToggle?.setAttribute('aria-label', 'Fechar menu');
  };

  menuToggle?.addEventListener('click', () => {
    if (appShell?.classList.contains('sidebar-open')) {
      fecharMenu();
    } else {
      abrirMenu();
    }
  });
  document.getElementById('sidebarClose')?.addEventListener('click', fecharMenu);
  document.getElementById('sidebarBackdrop')?.addEventListener('click', fecharMenu);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      fecharMenu();
    }
  });

  const novaConversa = () => {
    versaoConversa += 1;
    historicoIA = [];
    const botaoEnvio = document.getElementById('btn-IA');
    if (botaoEnvio) {
      botaoEnvio.disabled = false;
    }
    document.getElementById('respostaIA')?.replaceChildren();
    document.getElementById('conversation')?.classList.add('hidden');
    document.getElementById('welcomeScreen')?.classList.remove('hidden');
    document.getElementById('toolWorkspace')?.classList.add('hidden');
    document.getElementById('chatView')?.classList.remove('hidden');
    if (campoPergunta) {
      campoPergunta.value = '';
      ajustarCampo(campoPergunta);
      campoPergunta.focus();
    }
    fecharMenu();
  };
  document.getElementById('newChatButton')?.addEventListener('click', novaConversa);
  document.getElementById('sidebarNewChat')?.addEventListener('click', novaConversa);

  document.querySelectorAll('[data-prompt]').forEach((botao) => {
    botao.addEventListener('click', () => {
      if (campoPergunta) {
        campoPergunta.value = botao.dataset.prompt || '';
        ajustarCampo(campoPergunta);
        campoPergunta.focus();
        fecharMenu();
      }
    });
  });

  document.getElementById('capabilitiesButton')?.addEventListener('click', () => {
    showCapacidades();
    fecharMenu();
  });
  document.getElementById('backToChat')?.addEventListener('click', () => {
    document.getElementById('toolWorkspace')?.classList.add('hidden');
    document.getElementById('chatView')?.classList.remove('hidden');
  });

  const alternarTema = document.getElementById('themeToggle');
  alternarTema?.addEventListener('click', () => {
    const escuro = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = escuro ? 'dark' : 'light';
    alternarTema.setAttribute('aria-pressed', String(escuro));
    alternarTema.querySelector('span').textContent = escuro ? 'Modo claro' : 'Modo escuro';
  });

  document.getElementById('respostaIA')?.addEventListener('click', (event) => {
    const botao = event.target.closest('[data-action]');
    if (!botao) {
      return;
    }
    const acoes = botao.closest('.message-actions');
    if (botao.dataset.action === 'copy') {
      copiarTexto(acoes.dataset.answer, botao);
    } else if (botao.dataset.action === 'repeat') {
      botao.querySelector('span').textContent = 'Sem nova chamada';
      botao.setAttribute('aria-label', 'Ação demonstrativa; não foi feita nova chamada à IA');
    } else if (botao.dataset.action === 'rate') {
      const avaliado = botao.getAttribute('aria-pressed') !== 'true';
      botao.setAttribute('aria-pressed', String(avaliado));
      botao.querySelector('span').textContent = avaliado ? 'Obrigado' : 'Avaliar';
    }
  });

});
