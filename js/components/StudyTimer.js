import { formatTimer, formatPomodoro, formatDurationHuman } from '../utils/format.js';
import {
  getDayStudySessions,
  getDayTotalMs,
  addStudySession,
  removeStudySession,
} from '../utils/storage.js';
import { toDateKey } from '../utils/date.js';

export function renderStudyTimer(container, { state, engine, onUpdate }) {
  const subjects = state.subjects;

  function formatDisplay(ms) {
    return state.timer.mode === 'pomodoro' ? formatPomodoro(ms) : formatTimer(ms);
  }

  container.innerHTML = `
    <h2 class="timer-panel__title">Study Timer</h2>
    <div class="timer-subjects" role="group" aria-label="Çalışma alanı">
      ${subjects.map((s) => `
        <button type="button" class="timer-subject${state.timer.subject === s ? ' is-active' : ''}" data-subject="${s}">${s}</button>
      `).join('')}
    </div>
    <div class="timer-modes" role="group" aria-label="Zamanlayıcı modu">
      <button type="button" class="timer-mode${state.timer.mode === 'stopwatch' ? ' is-active' : ''}" data-mode="stopwatch">Kronometre</button>
      <button type="button" class="timer-mode${state.timer.mode === 'pomodoro' ? ' is-active' : ''}" data-mode="pomodoro">Pomodoro</button>
    </div>
    <div class="timer-display">
      <div class="timer-display__subject" id="timer-subject">${state.timer.subject.toUpperCase()}</div>
      <input type="text" class="timer-display__topic-input" id="timer-topic-input" value="${state.timer.topic || ''}" placeholder="Konu" aria-label="Çalışma konusu">
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

  const startBtn = container.querySelector('#timer-start');
  const resetBtn = container.querySelector('#timer-reset');
  const saveBtn = container.querySelector('#timer-save');
  const timeEl = container.querySelector('#timer-time');
  const subjectEl = container.querySelector('#timer-subject');
  const topicInput = container.querySelector('#timer-topic-input');
  const listEl = container.querySelector('#timer-today-list');

  function updateSaveButton() {
    const duration = engine.getSessionDuration();
    saveBtn.disabled = duration < 1000;
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
        <span class="timer-today__subject">${session.subject}${session.topic ? ` · ${session.topic}` : ''}</span>
        <span class="timer-today__duration">${formatDurationHuman(session.durationMs)}</span>
        <button type="button" class="timer-today__delete" aria-label="${session.subject} kaydını sil">×</button>
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
        const sessionId = row.dataset.sessionId;
        removeStudySession(state, todayKey, sessionId);
        renderTodaySessions();
        onUpdate?.();
      });
    });
  }

  function updateStartButton() {
    startBtn.textContent = state.timer.running ? 'Durdur' : 'Başlat';
    startBtn.classList.toggle('is-running', state.timer.running);
  }

  topicInput.addEventListener('input', () => {
    engine.setTopic(topicInput.value.trim());
  });

  container.querySelectorAll('.timer-subject').forEach((btn) => {
    btn.addEventListener('click', () => {
      engine.setSubject(btn.dataset.subject);
      subjectEl.textContent = btn.dataset.subject.toUpperCase();
      container.querySelectorAll('.timer-subject').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
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
    if (duration < 1000) return;

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

  return {
    tick(ms) {
      timeEl.textContent = formatDisplay(ms);
      updateSaveButton();
    },
    refresh() {
      renderTodaySessions();
      updateSaveButton();
      updateStartButton();
    },
    setTopic(text) {
      engine.setTopic(text);
      topicInput.value = text;
    },
  };
}
