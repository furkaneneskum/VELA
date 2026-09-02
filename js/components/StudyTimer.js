import { formatTimer, formatPomodoro, formatDurationHuman } from '../utils/format.js';
import {
  getDayStudySessions,
  getDayTotalMs,
  addStudySession,
  removeStudySession,
  addSubject,
  removeSubject,
} from '../utils/storage.js';
import { toDateKey } from '../utils/date.js';

function escapeHtml(text) {
  const el = document.createElement('span');
  el.textContent = text;
  return el.innerHTML;
}

export function renderStudyTimer(container, { state, engine, onUpdate }) {
  function formatDisplay(ms) {
    return state.timer.mode === 'pomodoro' ? formatPomodoro(ms) : formatTimer(ms);
  }

  const activeSubject = state.timer.subject || '';
  const subjectLabel = activeSubject ? activeSubject.toUpperCase() : '—';

  container.innerHTML = `
    <h2 class="timer-panel__title">VELA</h2>
    <div class="timer-subjects-wrap">
      <div class="timer-subjects" id="timer-subjects" role="group" aria-label="Çalışma alanları"></div>
      <form class="timer-subject-add" id="subject-add-form" hidden>
        <input type="text" id="subject-add-input" placeholder="Alan adı" maxlength="24" aria-label="Yeni alan adı" required autocomplete="off">
        <button type="submit" class="btn btn--primary timer-subject-add__submit">Ekle</button>
        <button type="button" class="timer-subject-add__cancel" id="subject-add-cancel" aria-label="İptal">×</button>
      </form>
      <button type="button" class="timer-subject timer-subject--add" id="subject-add-btn" aria-label="Alan ekle">+</button>
    </div>
    <div class="timer-modes" role="group" aria-label="Zamanlayıcı modu">
      <button type="button" class="timer-mode${state.timer.mode === 'stopwatch' ? ' is-active' : ''}" data-mode="stopwatch">Kronometre</button>
      <button type="button" class="timer-mode${state.timer.mode === 'pomodoro' ? ' is-active' : ''}" data-mode="pomodoro">Pomodoro</button>
    </div>
    <div class="timer-display">
      <div class="timer-display__subject" id="timer-subject">${escapeHtml(subjectLabel)}</div>
      <input type="text" class="timer-display__topic-input" id="timer-topic-input" value="${escapeHtml(state.timer.topic || '')}" placeholder="Konu" aria-label="Çalışma konusu">
      <div class="timer-display__time" id="timer-time" aria-live="polite">${formatDisplay(engine.getDisplayMs())}</div>
    </div>
    <div class="timer-controls">
      <button type="button" class="btn btn--primary" id="timer-start">${state.timer.running ? 'Durdur' : 'Başlat'}</button>
      <button type="button" class="btn btn--ghost" id="timer-reset">Sıfırla</button>
    </div>
    <button type="button" class="btn btn--accent timer-save" id="timer-save" disabled>Çalışmayı Kaydet</button>
    <div class="timer-today">
      <div class="timer-today__label">Bugün</div>
      <div class="timer-today__list" id="timer-today-list"></div>
    </div>
  `;

  const subjectsEl = container.querySelector('#timer-subjects');
  const addBtn = container.querySelector('#subject-add-btn');
  const addForm = container.querySelector('#subject-add-form');
  const addInput = container.querySelector('#subject-add-input');
  const addCancel = container.querySelector('#subject-add-cancel');
  const startBtn = container.querySelector('#timer-start');
  const resetBtn = container.querySelector('#timer-reset');
  const saveBtn = container.querySelector('#timer-save');
  const timeEl = container.querySelector('#timer-time');
  const subjectEl = container.querySelector('#timer-subject');
  const topicInput = container.querySelector('#timer-topic-input');
  const listEl = container.querySelector('#timer-today-list');

  function selectSubject(name) {
    engine.setSubject(name);
    subjectEl.textContent = name.toUpperCase();
    renderSubjects();
    updateSaveButton();
  }

  function renderSubjects() {
    if (state.subjects.length === 0) {
      subjectsEl.innerHTML = '';
      return;
    }

    subjectsEl.innerHTML = state.subjects.map((s) => `
      <span class="timer-subject-chip">
        <button type="button" class="timer-subject${state.timer.subject === s ? ' is-active' : ''}" data-subject="${escapeHtml(s)}">${escapeHtml(s)}</button>
        <button type="button" class="timer-subject__remove" data-remove="${escapeHtml(s)}" aria-label="${escapeHtml(s)} alanını kaldır">×</button>
      </span>
    `).join('');

    subjectsEl.querySelectorAll('.timer-subject[data-subject]').forEach((btn) => {
      btn.addEventListener('click', () => selectSubject(btn.dataset.subject));
    });

    subjectsEl.querySelectorAll('.timer-subject__remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeSubject(state, btn.dataset.remove);
        if (!state.timer.subject) {
          subjectEl.textContent = '—';
        }
        renderSubjects();
      });
    });
  }

  function openAddForm() {
    addForm.hidden = false;
    addBtn.hidden = true;
    addInput.value = '';
    addInput.focus();
  }

  function closeAddForm() {
    addForm.hidden = true;
    addBtn.hidden = false;
    addInput.value = '';
  }

  function updateSaveButton() {
    const duration = engine.getSessionDuration();
    saveBtn.disabled = duration < 1000 || !state.timer.subject;
  }

  function renderTodaySessions() {
    const todayKey = toDateKey();
    const sessions = getDayStudySessions(state, todayKey);
    const totalMs = getDayTotalMs(state, todayKey);

    if (sessions.length === 0) {
      listEl.innerHTML = `<div class="timer-today__row"><span class="timer-today__subject">—</span></div>`;
      return;
    }

    listEl.innerHTML = sessions.map((session) => `
      <div class="timer-today__row" data-session-id="${session.id}">
        <span class="timer-today__subject">${escapeHtml(session.subject)}${session.topic ? ` · ${escapeHtml(session.topic)}` : ''}</span>
        <span class="timer-today__duration">${formatDurationHuman(session.durationMs)}</span>
        <button type="button" class="timer-today__delete" aria-label="${escapeHtml(session.subject)} kaydını sil">×</button>
      </div>
    `).join('') + `
      <div class="timer-today__total">
        <span>Toplam</span>
        <span>${formatDurationHuman(totalMs)}</span>
      </div>
    `;

    listEl.querySelectorAll('.timer-today__delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.timer-today__row');
        removeStudySession(state, todayKey, row.dataset.sessionId);
        renderTodaySessions();
        onUpdate?.();
      });
    });
  }

  function updateStartButton() {
    startBtn.textContent = state.timer.running ? 'Durdur' : 'Başlat';
    startBtn.classList.toggle('is-running', state.timer.running);
  }

  renderSubjects();

  addBtn.addEventListener('click', openAddForm);
  addCancel.addEventListener('click', closeAddForm);

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = addInput.value.trim();
    if (!name) return;
    if (addSubject(state, name)) {
      selectSubject(name);
    }
    closeAddForm();
  });

  topicInput.addEventListener('input', () => {
    engine.setTopic(topicInput.value.trim());
  });

  container.querySelectorAll('.timer-mode').forEach((btn) => {
    btn.addEventListener('click', () => {
      engine.setMode(btn.dataset.mode);
      container.querySelectorAll('.timer-mode').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      updateStartButton();
      updateSaveButton();
      timeEl.textContent = formatDisplay(engine.getDisplayMs());
    });
  });

  startBtn.addEventListener('click', () => {
    if (state.timer.running) {
      engine.pause();
    } else {
      engine.start();
    }
    updateStartButton();
    updateSaveButton();
  });

  resetBtn.addEventListener('click', () => {
    engine.reset();
    updateStartButton();
    updateSaveButton();
    timeEl.textContent = formatDisplay(engine.getDisplayMs());
  });

  saveBtn.addEventListener('click', () => {
    const duration = engine.getSessionDuration();
    if (duration < 1000 || !state.timer.subject) return;

    addStudySession(state, toDateKey(), {
      subject: state.timer.subject,
      topic: state.timer.topic,
      durationMs: duration,
    });

    engine.clearSession();
    updateStartButton();
    updateSaveButton();
    timeEl.textContent = formatDisplay(engine.getDisplayMs());
    renderTodaySessions();
    onUpdate?.();
  });

  renderTodaySessions();
  updateSaveButton();

  return {
    tick(ms) {
      timeEl.textContent = formatDisplay(ms);
      updateSaveButton();
    },
    refresh() {
      renderSubjects();
      renderTodaySessions();
      updateSaveButton();
      updateStartButton();
      if (state.timer.subject) {
        subjectEl.textContent = state.timer.subject.toUpperCase();
      }
    },
    setTopic(text) {
      engine.setTopic(text);
      topicInput.value = text;
    },
  };
}
