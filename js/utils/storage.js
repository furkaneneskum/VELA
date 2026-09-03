import { toDateKey, getWeekKey, getWeekDays, parseDateKey, formatWeekRange, formatDayShort } from './date.js';
import { generateId } from './format.js';

const STORAGE_KEY = 'vela-data';

function createEmptyDay() {
  return {
    plans: [],
    notes: '',
    studySessions: [],
    subjectTotals: {},
  };
}

function createDefaultState() {
  return {
    weekKey: getWeekKey(),
    days: {},
    archive: {},
    timer: {
      mode: 'stopwatch',
      subject: '',
      topic: '',
      running: false,
      startedAt: null,
      elapsedMs: 0,
      pomodoroRemainingMs: 25 * 60 * 1000,
      lastTick: null,
    },
    selectedDayKey: toDateKey(),
    subjects: [],
  };
}

function loadRaw() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem('ajanda-data');
    }
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildWeekSnapshot(state, weekKey) {
  const monday = parseDateKey(weekKey);
  const weekDays = getWeekDays(monday);
  const dayTotals = {};
  let weekTotal = 0;

  weekDays.forEach((date) => {
    const key = toDateKey(date);
    const ms = getDayTotalMsFromState(state, key);
    dayTotals[key] = ms;
    weekTotal += ms;
  });

  return {
    weekKey,
    weekLabel: formatWeekRange(monday),
    dayTotals,
    weekTotal,
    dayKeys: weekDays.map(toDateKey),
    dayLabels: weekDays.map(formatDayShort),
  };
}

function getDayTotalMsFromState(state, dateKey) {
  const day = state.days[dateKey];
  if (!day) return 0;
  return Object.values(day.subjectTotals || {}).reduce((sum, ms) => sum + ms, 0);
}

function archiveWeekIfNeeded(state, oldWeekKey) {
  if (!oldWeekKey || state.archive?.[oldWeekKey]) return;

  const snapshot = buildWeekSnapshot(state, oldWeekKey);
  const hasData = snapshot.weekTotal > 0 || snapshot.dayKeys.some((key) => {
    const day = state.days[key];
    return day && (day.plans?.length > 0 || day.notes?.trim());
  });

  if (!hasData) return;

  if (!state.archive) state.archive = {};
  state.archive[oldWeekKey] = snapshot;
}

export function loadState() {
  const raw = loadRaw();
  const state = { ...createDefaultState(), ...(raw || {}) };

  if (!state.days) state.days = {};
  if (!state.archive) state.archive = {};
  if (!state.timer) state.timer = createDefaultState().timer;
  if (!Array.isArray(state.subjects)) {
    state.subjects = [];
  }

  if (state.timer?.subject && !state.subjects.includes(state.timer.subject)) {
    if (state.timer.subject.trim()) {
      state.subjects.push(state.timer.subject);
    } else {
      state.timer.subject = '';
    }
  }

  const currentWeekKey = getWeekKey();

  if (state.weekKey && state.weekKey !== currentWeekKey) {
    archiveWeekIfNeeded(state, state.weekKey);
    state.weekKey = currentWeekKey;
    saveState(state);
  } else {
    state.weekKey = currentWeekKey;
  }

  return state;
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getDay(state, dateKey) {
  if (!state.days[dateKey]) {
    state.days[dateKey] = createEmptyDay();
  }
  return state.days[dateKey];
}

export function addPlan(state, dateKey, plan) {
  const day = getDay(state, dateKey);
  day.plans.push({
    id: generateId(),
    time: plan.time,
    subject: plan.subject || '',
    task: plan.task,
    note: plan.note || '',
    completed: false,
  });
  day.plans.sort((a, b) => a.time.localeCompare(b.time));
  saveState(state);
}

export function togglePlan(state, dateKey, planId) {
  const day = getDay(state, dateKey);
  const plan = day.plans.find((p) => p.id === planId);
  if (plan) {
    plan.completed = !plan.completed;
    saveState(state);
  }
}

export function removePlan(state, dateKey, planId) {
  const day = getDay(state, dateKey);
  day.plans = day.plans.filter((p) => p.id !== planId);
  saveState(state);
}

export function setNotes(state, dateKey, notes) {
  const day = getDay(state, dateKey);
  day.notes = notes;
  saveState(state);
}

export function addStudySession(state, dateKey, session) {
  const day = getDay(state, dateKey);
  day.studySessions.push({
    id: generateId(),
    subject: session.subject,
    topic: session.topic || '',
    durationMs: session.durationMs,
    savedAt: new Date().toISOString(),
  });

  if (!day.subjectTotals[session.subject]) {
    day.subjectTotals[session.subject] = 0;
  }
  day.subjectTotals[session.subject] += session.durationMs;
  saveState(state);
}

export function removeStudySession(state, dateKey, sessionId) {
  const day = getDay(state, dateKey);
  const index = day.studySessions.findIndex((s) => s.id === sessionId);
  if (index === -1) return;

  const session = day.studySessions[index];
  day.studySessions.splice(index, 1);

  if (day.subjectTotals[session.subject]) {
    day.subjectTotals[session.subject] -= session.durationMs;
    if (day.subjectTotals[session.subject] <= 0) {
      delete day.subjectTotals[session.subject];
    }
  }

  saveState(state);
}

export function getDayStudySessions(state, dateKey) {
  const day = state.days[dateKey];
  if (!day) return [];
  return [...(day.studySessions || [])];
}

export function getDayTotalMs(state, dateKey) {
  return getDayTotalMsFromState(state, dateKey);
}

export function getDaySubjectTotals(state, dateKey) {
  const day = state.days[dateKey];
  if (!day) return {};
  return { ...(day.subjectTotals || {}) };
}

export function getCurrentWeekSnapshot(state) {
  return buildWeekSnapshot(state, getWeekKey());
}

export function getArchiveWeeks(state) {
  if (!state.archive) return [];
  return Object.values(state.archive).sort((a, b) => b.weekKey.localeCompare(a.weekKey));
}

export function saveTimerState(state, timerData) {
  state.timer = { ...state.timer, ...timerData };
  saveState(state);
}

export function addSubject(state, name) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 24 || /[<>"']/.test(trimmed)) return false;
  if (state.subjects.includes(trimmed)) return false;
  state.subjects.push(trimmed);
  saveState(state);
  return true;
}

export function removeSubject(state, name) {
  state.subjects = state.subjects.filter((s) => s !== name);
  if (state.timer.subject === name) {
    state.timer.subject = '';
    saveTimerState(state, { subject: '' });
  } else {
    saveState(state);
  }
}
