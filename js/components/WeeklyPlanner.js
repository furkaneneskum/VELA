import { getWeekDays, toDateKey, formatDayShort, isToday } from '../utils/date.js';
import { renderDayCard } from './DayCard.js';

export function renderWeeklyPlanner(container, navContainer, { state, onAddPlan, onSelectDay, onUpdate }) {
  const weekDays = getWeekDays();
  const isMobileView = window.innerWidth < 1200;
  const selectedKey = state.selectedDayKey || toDateKey();

  if (navContainer) {
    navContainer.innerHTML = weekDays.map((date) => {
      const key = toDateKey(date);
      const active = key === selectedKey ? ' is-active' : '';
      const today = isToday(date) ? ' is-today' : '';
      return `<button type="button" class="day-nav__btn${active}${today}" data-key="${key}">${formatDayShort(date)}</button>`;
    }).join('');

    navContainer.querySelectorAll('.day-nav__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        onSelectDay(btn.dataset.key);
      });
    });
  }

  container.innerHTML = '';
  weekDays.forEach((date) => {
    const card = renderDayCard(date, {
      state,
      selectedKey,
      isMobileView,
      onAddPlan,
      onUpdate: (data) => {
        if (data?.selectedDayKey) onSelectDay(data.selectedDayKey);
        else onUpdate?.();
      },
    });
    container.appendChild(card);
  });
}
