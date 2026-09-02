import { loadState, saveState, addPlan } from './utils/storage.js';
import { toDateKey, isDateKeyInCurrentWeek } from './utils/date.js';
import { TimerEngine } from './timer/engine.js';
import { renderHeader } from './components/Header.js';
import { renderStudyTimer } from './components/StudyTimer.js';
import { renderWeeklyPlanner } from './components/WeeklyPlanner.js';
import { renderWeeklySummary } from './components/WeeklySummary.js';
import { initPlanModal } from './components/PlanModal.js';

const state = loadState();
if (!state.selectedDayKey || !isDateKeyInCurrentWeek(state.selectedDayKey)) {
  state.selectedDayKey = toDateKey();
}
saveState(state);

const headerEl = document.getElementById('header');
const timerEl = document.getElementById('timer-panel');
const plannerEl = document.getElementById('weekly-planner');
const summaryEl = document.getElementById('weekly-summary');
const dayNavEl = document.getElementById('day-nav');
const modalEl = document.getElementById('plan-modal');

let timerUI = null;

const engine = new TimerEngine(
  state,
  (ms) => timerUI?.tick(ms),
  () => {
    timerUI?.tick(engine.getDisplayMs());
  }
);

function refreshAll() {
  renderWeeklyPlanner(plannerEl, dayNavEl, {
    state,
    onAddPlan: (dateKey) => planModal.open(dateKey),
    onSelectDay: selectDay,
    onUpdate: refreshAll,
  });
  renderWeeklySummary(summaryEl, state);
  timerUI?.refresh();
}

function selectDay(dateKey) {
  state.selectedDayKey = dateKey;
  saveState(state);
  refreshAll();
}

function goToToday() {
  selectDay(toDateKey());
  document.querySelector('.day-card.is-today')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

const planModal = initPlanModal(modalEl, {
  onSave(dateKey, plan) {
    addPlan(state, dateKey, plan);
    refreshAll();
  },
});

renderHeader(headerEl, {
  onToday: goToToday,
  onAddPlan: () => planModal.open(state.selectedDayKey || toDateKey()),
});

timerUI = renderStudyTimer(timerEl, {
  state,
  engine,
  onUpdate: refreshAll,
});

refreshAll();

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(refreshAll, 150);
});

window.addEventListener('beforeunload', () => {
  engine.destroy();
});
