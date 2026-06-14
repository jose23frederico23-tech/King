let chatName = 'king';

// Funções de navegação
function showCapacidades() {
  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('capacidadesMenu').classList.remove('hidden');
}

function voltarMenu() {
  document.getElementById('capacidadesMenu').classList.add('hidden');
  document.getElementById('mainMenu').classList.remove('hidden');
  document.getElementById('horariosMenu').classList.add('hidden');
  document.getElementById('metodosMenu').classList.add('hidden');
  document.getElementById('financasMenu').classList.add('hidden');
  document.getElementById('autoconfiancaMenu').classList.add('hidden');
}

function voltarCapacidades() {
  document.getElementById('horariosMenu').classList.add('hidden');
  document.getElementById('metodosMenu').classList.add('hidden');
  document.getElementById('financasMenu').classList.add('hidden');
  document.getElementById('autoconfiancaMenu').classList.add('hidden');
  document.getElementById('capacidadesMenu').classList.remove('hidden');
}

function showHorarios() {
  document.getElementById('capacidadesMenu').classList.add('hidden');
  document.getElementById('horariosMenu').classList.remove('hidden');
}

function showMetodos() {
  document.getElementById('capacidadesMenu').classList.add('hidden');
  document.getElementById('metodosMenu').classList.remove('hidden');
}

function showFinancas() {
  document.getElementById('capacidadesMenu').classList.add('hidden');
  document.getElementById('financasMenu').classList.remove('hidden');
  document.getElementById('financasConteudo').innerHTML = `
    <h3>Educação Financeira</h3>
    <p><strong>O que é:</strong> Saber controlar dinheiro e investir.</p>
  `;
}

function showAutoconfianca() {
  document.getElementById('capacidadesMenu').classList.add('hidden');
  document.getElementById('autoconfiancaMenu').classList.remove('hidden');
  document.getElementById('autoconfiancaConteudo').innerHTML = `
    <h3>Autoconfiança</h3>
    <p>Disciplina e consistência são fundamentais.</p>
  `;
}

function alterarNome() {
  let novoNome = prompt('Digite o novo nome:', chatName);
  if (novoNome && novoNome.trim() !== '') {
    chatName = novoNome.trim();
    document.getElementById('chatName').textContent = chatName;
  }
}

function gerarHorario() {
  const periodo = document.getElementById('periodoInput').value.toLowerCase().trim();
  let resultado = '';

  if (periodo === 'manha') {
    resultado = 'Estudar das 9h às 11h';
  } else if (periodo === 'tarde') {
    resultado = 'Estudar das 16h às 18h';
  } else if (periodo === 'noite') {
    resultado = 'Estudar das 20h às 22h';
  } else {
    resultado = 'Período inválido';
  }

  document.getElementById('horarioResultado').innerHTML = resultado;
}

function mostrarMetodo(numero) {
  let resultado = '';

  switch (numero) {
    case 1:
      resultado = 'Pomodoro';
      break;
    case 2:
      resultado = 'Feynman';
      break;
    default:
      resultado = 'Opção inválida';
  }

  document.getElementById('metodoResultado').innerHTML = resultado;
}

// 🔥 SISTEMA DE CADASTRO CORRIGIDO
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cadastro').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formcadastro = {
      nome: document.getElementById('nome').value,
      email: document.getElementById('email').value,
      telefone: document.getElementById('telefone').value,
      interesse: document.getElementById('interesse').value
    };

    const mensagemDiv = document.getElementById('cadastroMensagem');
    mensagemDiv.innerHTML = 'Enviando...';
    mensagemDiv.className = 'mensagem';

    try {
      const response = await fetch('/formcadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formcadastro)
      });

      const data = await response.json();

      if (response.ok) {
        mensagemDiv.innerHTML = 'Cadastro realizado com sucesso!';
        mensagemDiv.className = 'mensagem sucesso';
        document.getElementById('cadastro').reset();
      } else {
        mensagemDiv.innerHTML = `Erro: ${data.error || 'Tente novamente'}`;
        mensagemDiv.className = 'mensagem erro';
      }

    } catch (error) {
      mensagemDiv.innerHTML = 'Erro ao conectar com o servidor.';
      mensagemDiv.className = 'mensagem erro';
      console.error('Erro:', error);
    }
  });
});