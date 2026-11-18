'use strict';

const STORAGE_KEY = 'king.gerador-disciplinas.v1';
const AI_URL_KEY = 'king.gerador-disciplinas.ai-url.v1';
const DATABASE_NAME = 'king-gerador-disciplinas';
const DATABASE_VERSION = 1;
const FILE_STORE = 'files';

const elements = {
  newButton: document.querySelector('#new-discipline'),
  emptyNewButton: document.querySelector('#empty-new-discipline'),
  editor: document.querySelector('#editor'),
  editorTitle: document.querySelector('#editor-title'),
  editorEyebrow: document.querySelector('#editor-eyebrow'),
  form: document.querySelector('#discipline-form'),
  disciplineId: document.querySelector('#discipline-id'),
  name: document.querySelector('#discipline-name'),
  points: document.querySelector('#discipline-points'),
  description: document.querySelector('#discipline-description'),
  prompt: document.querySelector('#ai-prompt'),
  resourceUrl: document.querySelector('#resource-url'),
  addLink: document.querySelector('#add-link'),
  fileInput: document.querySelector('#file-input'),
  pendingLinks: document.querySelector('#pending-links'),
  pendingFiles: document.querySelector('#pending-files'),
  list: document.querySelector('#discipline-list'),
  empty: document.querySelector('#empty-state'),
  search: document.querySelector('#search'),
  ranking: document.querySelector('#ranking-list'),
  rankingEmpty: document.querySelector('#ranking-empty'),
  disciplineCount: document.querySelector('#discipline-count'),
  pointsCount: document.querySelector('#points-count'),
  peopleCount: document.querySelector('#people-count'),
  aiUrl: document.querySelector('#ai-url'),
  saveAiUrl: document.querySelector('#save-ai-url'),
  toast: document.querySelector('#toast')
};

let data = loadData();
let pendingLinks = [];
let pendingFiles = [];
let keptFiles = [];
let toastTimer;

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      disciplines: Array.isArray(saved.disciplines) ? saved.disciplines : [],
      awards: Array.isArray(saved.awards) ? saved.awards : []
    };
  } catch (error) {
    console.error('Não foi possível ler os dados guardados.', error);
    return { disciplines: [], awards: [] };
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Não foi possível guardar os dados.', error);
    showToast('Não foi possível guardar. O armazenamento do navegador pode estar cheio.', true);
    return false;
  }
  return true;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Este navegador não suporta o armazenamento de documentos.'));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(FILE_STORE)) {
        database.createObjectStore(FILE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Não foi possível abrir o armazenamento de documentos.'));
  });
}

async function storeFile(fileRecord) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FILE_STORE, 'readwrite');
    transaction.objectStore(FILE_STORE).put(fileRecord);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error || new Error('Não foi possível guardar o documento.')); };
    transaction.onabort = () => { database.close(); reject(transaction.error || new Error('O armazenamento do documento foi cancelado.')); };
  });
}

async function getFile(id) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FILE_STORE, 'readonly');
    const request = transaction.objectStore(FILE_STORE).get(id);
    request.onsuccess = () => { database.close(); resolve(request.result); };
    request.onerror = () => { database.close(); reject(request.error || new Error('Não foi possível abrir o documento.')); };
  });
}

async function removeFile(id) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FILE_STORE, 'readwrite');
    transaction.objectStore(FILE_STORE).delete(id);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error || new Error('Não foi possível remover o documento.')); };
  });
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function showToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle('error', isError);
  elements.toast.classList.add('visible');
  toastTimer = window.setTimeout(() => elements.toast.classList.remove('visible'), 3500);
}

function openEditor(discipline = null) {
  elements.form.reset();
  pendingLinks = discipline ? [...(discipline.links || [])] : [];
  pendingFiles = [];
  keptFiles = discipline ? [...(discipline.files || [])] : [];
  elements.disciplineId.value = discipline ? discipline.id : '';
  elements.name.value = discipline ? discipline.name : '';
  elements.points.value = discipline ? discipline.points : 10;
  elements.description.value = discipline ? discipline.description : '';
  elements.prompt.value = discipline ? discipline.prompt : '';
  elements.editorTitle.textContent = discipline ? 'Editar disciplina' : 'Criar disciplina';
  elements.editorEyebrow.textContent = discipline ? 'Atualiza o teu plano' : 'Nova matéria';
  document.querySelector('#submit-discipline').textContent = discipline ? 'Guardar alterações' : 'Guardar disciplina';
  renderPendingResources();
  elements.editor.hidden = false;
  elements.editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  elements.name.focus({ preventScroll: true });
}

function closeEditor() {
  elements.editor.hidden = true;
  elements.form.reset();
  pendingLinks = [];
  pendingFiles = [];
  keptFiles = [];
  renderPendingResources();
}

function renderPendingResources() {
  elements.pendingLinks.innerHTML = pendingLinks.map((link, index) => `
    <li class="pending-resource">
      <span>${escapeHtml(link.label || link.url)}</span>
      <button class="remove-resource" type="button" data-remove-link="${index}" aria-label="Remover link">×</button>
    </li>`).join('');
  const savedFiles = keptFiles.map((file) => `
    <li class="pending-resource">
      <span>${escapeHtml(file.name)} <small>(guardado)</small></span>
      <button class="remove-resource" type="button" data-remove-saved-file="${escapeHtml(file.id)}" aria-label="Remover ${escapeHtml(file.name)}">×</button>
    </li>`).join('');
  const newFiles = pendingFiles.map((file, index) => `
    <li class="pending-resource">
      <span>${escapeHtml(file.name)} <small>(${formatBytes(file.size)})</small></span>
      <button class="remove-resource" type="button" data-remove-file="${index}" aria-label="Remover ${escapeHtml(file.name)}">×</button>
    </li>`).join('');
  elements.pendingFiles.innerHTML = savedFiles + newFiles;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function render() {
  const search = elements.search.value.trim().toLocaleLowerCase();
  const disciplines = data.disciplines.filter((discipline) =>
    `${discipline.name} ${discipline.description || ''}`.toLocaleLowerCase().includes(search)
  );
  elements.list.innerHTML = disciplines.map(renderDiscipline).join('');
  elements.empty.hidden = data.disciplines.length > 0;
  elements.list.hidden = disciplines.length === 0;
  if (data.disciplines.length > 0 && disciplines.length === 0) {
    elements.list.hidden = false;
    elements.list.innerHTML = '<p class="muted-empty">Nenhuma disciplina corresponde à pesquisa.</p>';
  }
  renderRanking();
}

function renderDiscipline(discipline) {
  const links = (discipline.links || []).map((link) => {
    const href = safeUrl(link.url);
    return href ? `<li class="resource-link"><span class="resource-symbol" aria-hidden="true">↗</span><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label || link.url)}</a></li>` : '';
  }).join('');
  const files = (discipline.files || []).map((file) => `
    <li class="file-resource">
      <span class="resource-symbol" aria-hidden="true">▧</span>
      <button type="button" data-open-file="${escapeHtml(file.id)}">${escapeHtml(file.name)}</button>
      <span class="muted-empty">${escapeHtml(formatBytes(file.size))}</span>
    </li>`).join('');
  const aiButton = discipline.prompt
    ? `<button class="text-button" type="button" data-send-ai="${escapeHtml(discipline.id)}">✳ Abrir na IA do King</button>`
    : '';
  return `
    <article class="discipline-card">
      <div class="card-top">
        <div>
          <h3 class="card-title">${escapeHtml(discipline.name)}</h3>
          ${discipline.description ? `<p class="card-description">${escapeHtml(discipline.description)}</p>` : ''}
        </div>
        <span class="points-pill">＋${escapeHtml(discipline.points)} pts</span>
      </div>
      ${(links || files) ? `<ul class="resource-list">${links}${files}</ul>` : ''}
      <div class="card-actions">
        ${aiButton}
        <button class="text-button" type="button" data-edit="${escapeHtml(discipline.id)}">Editar</button>
        <button class="text-button danger" type="button" data-delete="${escapeHtml(discipline.id)}">Eliminar</button>
      </div>
      <form class="award-form" data-award="${escapeHtml(discipline.id)}">
        <input name="username" type="text" maxlength="60" placeholder="Nome da pessoa" aria-label="Nome da pessoa que recebe pontos" required>
        <input name="points" type="number" min="0" max="100000" step="1" value="${escapeHtml(discipline.points)}" aria-label="Pontos a atribuir" required>
        <button class="button button-small button-secondary" type="submit">Atribuir pontos</button>
      </form>
    </article>`;
}

function renderRanking() {
  const totals = new Map();
  for (const award of data.awards) {
    const key = award.username.trim().toLocaleLowerCase();
    const current = totals.get(key) || { name: award.username, points: 0 };
    current.points += Number(award.points) || 0;
    totals.set(key, current);
  }
  const ranking = [...totals.values()].sort((first, second) =>
    second.points - first.points || first.name.localeCompare(second.name, 'pt')
  );
  elements.ranking.innerHTML = ranking.map((person, index) => `
    <li class="rank-row">
      <span class="rank-number">${index + 1}</span>
      <span class="rank-name">${escapeHtml(person.name)}</span>
      <span class="rank-score">${person.points} pts</span>
    </li>`).join('');
  elements.rankingEmpty.hidden = ranking.length > 0;
  elements.disciplineCount.textContent = String(data.disciplines.length);
  elements.pointsCount.textContent = String(data.awards.reduce((sum, award) => sum + (Number(award.points) || 0), 0));
  elements.peopleCount.textContent = String(ranking.length);
}

async function saveDiscipline(event) {
  event.preventDefault();
  const name = elements.name.value.trim();
  const points = Number(elements.points.value);
  if (!name || !Number.isInteger(points) || points < 0 || points > 100000) {
    showToast('Indica um nome e uma quantidade válida de pontos.', true);
    return;
  }

  const oldId = elements.disciplineId.value;
  const existing = data.disciplines.find((discipline) => discipline.id === oldId);
  const id = existing ? existing.id : makeId();
  const newFileRecords = pendingFiles.map((file) => ({
    id: makeId(),
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    blob: file
  }));
  const discipline = {
    id,
    name,
    points,
    description: elements.description.value.trim(),
    prompt: elements.prompt.value.trim(),
    links: pendingLinks,
    files: [...keptFiles, ...newFileRecords.map(({ blob, ...metadata }) => metadata)]
  };

  try {
    for (const file of newFileRecords) await storeFile(file);
    if (existing) {
      data.disciplines = data.disciplines.map((item) => item.id === id ? discipline : item);
    } else {
      data.disciplines.unshift(discipline);
    }
    if (!saveData()) {
      if (!existing) data.disciplines = data.disciplines.filter((item) => item.id !== id);
      return;
    }
    const retainedIds = new Set(discipline.files.map((file) => file.id));
    for (const oldFile of (existing ? existing.files || [] : [])) {
      if (!retainedIds.has(oldFile.id)) await removeFile(oldFile.id);
    }
    closeEditor();
    render();
    showToast(existing ? 'Disciplina atualizada.' : 'Disciplina criada.');
  } catch (error) {
    console.error('Não foi possível guardar a disciplina e os seus documentos.', error);
    showToast(error.message || 'Não foi possível guardar a disciplina.', true);
  }
}

async function openFile(id) {
  try {
    const file = await getFile(id);
    if (!file || !file.blob) {
      showToast('Este documento não está disponível neste navegador.', true);
      return;
    }
    const objectUrl = URL.createObjectURL(file.blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.download = file.name;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (error) {
    console.error('Não foi possível abrir o documento.', error);
    showToast(error.message || 'Não foi possível abrir o documento.', true);
  }
}

function sendToAi(id) {
  const discipline = data.disciplines.find((item) => item.id === id);
  const baseUrl = safeUrl(localStorage.getItem(AI_URL_KEY) || '');
  if (!baseUrl) {
    elements.aiUrl.focus();
    document.querySelector('.ai-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('Configura primeiro o endereço da IA do King.', true);
    return;
  }
  const target = new URL(baseUrl);
  target.searchParams.set('prompt', discipline.prompt);
  window.open(target.href, '_blank', 'noopener,noreferrer');
}

elements.newButton.addEventListener('click', () => openEditor());
elements.emptyNewButton.addEventListener('click', () => openEditor());
document.querySelector('#close-editor').addEventListener('click', closeEditor);
document.querySelector('#cancel-editor').addEventListener('click', closeEditor);
elements.form.addEventListener('submit', saveDiscipline);
elements.search.addEventListener('input', render);

elements.addLink.addEventListener('click', () => {
  const url = safeUrl(elements.resourceUrl.value.trim());
  if (!url) {
    showToast('Indica um link válido começado por http:// ou https://.', true);
    elements.resourceUrl.focus();
    return;
  }
  if (pendingLinks.some((link) => link.url === url)) {
    showToast('Este link já foi adicionado.');
    return;
  }
  pendingLinks.push({ label: new URL(url).hostname, url });
  elements.resourceUrl.value = '';
  renderPendingResources();
});

elements.fileInput.addEventListener('change', () => {
  const selectedFiles = [...elements.fileInput.files];
  pendingFiles.push(...selectedFiles);
  elements.fileInput.value = '';
  renderPendingResources();
});

elements.pendingLinks.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-link]');
  if (!button) return;
  pendingLinks.splice(Number(button.dataset.removeLink), 1);
  renderPendingResources();
});

elements.pendingFiles.addEventListener('click', async (event) => {
  const newFileButton = event.target.closest('[data-remove-file]');
  if (newFileButton) {
    pendingFiles.splice(Number(newFileButton.dataset.removeFile), 1);
    renderPendingResources();
    return;
  }
  const savedFileButton = event.target.closest('[data-remove-saved-file]');
  if (savedFileButton) {
    keptFiles = keptFiles.filter((file) => file.id !== savedFileButton.dataset.removeSavedFile);
    renderPendingResources();
  }
});

elements.list.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-edit]');
  const deleteButton = event.target.closest('[data-delete]');
  const fileButton = event.target.closest('[data-open-file]');
  const aiButton = event.target.closest('[data-send-ai]');

  if (editButton) {
    const discipline = data.disciplines.find((item) => item.id === editButton.dataset.edit);
    if (discipline) openEditor(discipline);
  } else if (deleteButton) {
    const discipline = data.disciplines.find((item) => item.id === deleteButton.dataset.delete);
    if (!discipline || !window.confirm(`Eliminar a disciplina “${discipline.name}”? Os pontos já atribuídos ficam no ranking.`)) return;
    data.disciplines = data.disciplines.filter((item) => item.id !== discipline.id);
    if (!saveData()) return;
    try {
      for (const file of discipline.files || []) await removeFile(file.id);
      render();
      showToast('Disciplina eliminada. Os pontos atribuídos foram mantidos.');
    } catch (error) {
      console.error('Disciplina eliminada, mas não foi possível limpar todos os ficheiros.', error);
      render();
      showToast('Disciplina eliminada, mas alguns ficheiros antigos não foram removidos.', true);
    }
  } else if (fileButton) {
    await openFile(fileButton.dataset.openFile);
  } else if (aiButton) {
    sendToAi(aiButton.dataset.sendAi);
  }
});

elements.list.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-award]');
  if (!form) return;
  event.preventDefault();
  const discipline = data.disciplines.find((item) => item.id === form.dataset.award);
  const username = new FormData(form).get('username').toString().trim();
  const points = Number(new FormData(form).get('points'));
  if (!discipline || !username || !Number.isInteger(points) || points < 0 || points > 100000) {
    showToast('Indica um nome e uma quantidade válida de pontos.', true);
    return;
  }
  data.awards.push({
    id: makeId(),
    username,
    points,
    disciplineId: discipline.id,
    disciplineName: discipline.name,
    createdAt: new Date().toISOString()
  });
  if (!saveData()) {
    data.awards.pop();
    return;
  }
  render();
  showToast(`${points} pontos atribuídos a ${username}.`);
});

elements.saveAiUrl.addEventListener('click', () => {
  const value = elements.aiUrl.value.trim();
  if (!value) {
    localStorage.removeItem(AI_URL_KEY);
    showToast('Endereço da IA removido.');
    return;
  }
  const url = safeUrl(value);
  if (!url) {
    showToast('Indica um endereço válido começado por http:// ou https://.', true);
    elements.aiUrl.focus();
    return;
  }
  localStorage.setItem(AI_URL_KEY, url);
  elements.aiUrl.value = url;
  showToast('Endereço da IA guardado.');
});

elements.aiUrl.value = localStorage.getItem(AI_URL_KEY) || '';
render();
