// ================== ESTADO ==================
let tasks = JSON.parse(localStorage.getItem('pwa_tasks')) || [];
let currentFilter = 'all';

// ================== ELEMENTOS ==================
const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const emptyMsg = document.getElementById('empty-msg');
const statsText = document.getElementById('stats-text');
const clearDoneBtn = document.getElementById('clear-done');
const filterBtns = document.querySelectorAll('.filter-btn');
const dateEl = document.getElementById('date');

// Data no header
dateEl.textContent = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: 'numeric', month: 'long'
});

// ================== RENDER ==================
function save() {
  localStorage.setItem('pwa_tasks', JSON.stringify(tasks));
}

function render() {
  const filtered = tasks.filter(t => {
    if (currentFilter === 'pending') return !t.done;
    if (currentFilter === 'done') return t.done;
    return true;
  });

  list.innerHTML = '';

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    li.innerHTML = `
      <div class="task-check" role="checkbox" aria-checked="${task.done}">${task.done ? '✓' : ''}</div>
      <span class="task-text">${escapeHtml(task.text)}</span>
      <button class="delete-btn" aria-label="Excluir tarefa">🗑️</button>
    `;

    li.querySelector('.task-check').addEventListener('click', () => toggleTask(task.id));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

    list.appendChild(li);
  });

  emptyMsg.classList.toggle('show', filtered.length === 0);
  updateStats();
}

function updateStats() {
  const pending = tasks.filter(t => !t.done).length;
  const done = tasks.length - pending;
  statsText.textContent = `${tasks.length} tarefa${tasks.length !== 1 ? 's' : ''} • ${pending} pendente${pending !== 1 ? 's' : ''} • ${done} concluída${done !== 1 ? 's' : ''}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ================== AÇÕES ==================
function addTask(text) {
  tasks.unshift({ id: Date.now().toString(), text: text.trim(), done: false });
  save();
  render();
}

function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (t) {
    t.done = !t.done;
    save();
    render();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
}

// ================== EVENTOS ==================
form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) {
    addTask(text);
    input.value = '';
    input.focus();
  }
});

clearDoneBtn.addEventListener('click', () => {
  if (tasks.some(t => t.done)) {
    tasks = tasks.filter(t => !t.done);
    save();
    render();
  }
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

// ================== SERVICE WORKER ==================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registrado:', reg.scope))
      .catch(err => console.error('Erro ao registrar SW:', err));
  });
}

// ================== INSTALAÇÃO PWA ==================
let deferredPrompt;
const installBanner = document.getElementById('install-banner');
const installBtn = document.getElementById('install-btn');
const dismissBtn = document.getElementById('dismiss-btn');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  if (!localStorage.getItem('install_dismissed')) {
    installBanner.classList.remove('hidden');
  }
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('Instalação:', outcome);
  deferredPrompt = null;
  installBanner.classList.add('hidden');
});

dismissBtn.addEventListener('click', () => {
  installBanner.classList.add('hidden');
  localStorage.setItem('install_dismissed', '1');
});

window.addEventListener('appinstalled', () => {
  installBanner.classList.add('hidden');
  console.log('PWA instalada com sucesso!');
});

// ================== INIT ==================
render();