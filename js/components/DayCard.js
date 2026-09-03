import { toDateKey, formatDayLabel, formatDayDate, isToday } from '../utils/date.js';
import { formatDurationHuman } from '../utils/format.js';
import { getDay, getDayTotalMs, togglePlan, removePlan, setNotes } from '../utils/storage.js';

export function renderDayCard(dayDate, { state, selectedKey, isMobileView, onAddPlan, onUpdate }) {
  const dateKey = toDateKey(dayDate);
  const day = getDay(state, dateKey);
  const today = isToday(dayDate);
  const selected = dateKey === selectedKey;
  const totalMs = getDayTotalMs(state, dateKey);

  const hiddenClass = isMobileView && !selected ? ' is-hidden-mobile' : '';
  const todayClass = today ? ' is-today' : '';
  const selectedClass = selected && isMobileView ? ' is-selected' : '';

  const card = document.createElement('article');
  card.className = `day-card${todayClass}${selectedClass}${hiddenClass}`;
  card.dataset.dateKey = dateKey;
  card.setAttribute('aria-label', formatDayLabel(dayDate));

  card.innerHTML = `
    <header class="day-card__head">
      <div>
        <h3 class="day-card__label">${formatDayLabel(dayDate)}</h3>
        <span class="day-card__date">${formatDayDate(dayDate)}</span>
      </div>
      <button type="button" class="day-card__add" data-action="add">+</button>
    </header>
    <ul class="plan-list" role="list">
      ${day.plans.length === 0
        ? '<li class="plan-list__empty">—</li>'
        : day.plans.map((plan) => `
          <li class="plan-item${plan.completed ? ' is-done' : ''}" data-plan-id="${plan.id}">
            <span class="plan-item__time">${plan.time}</span>
            <div class="plan-item__body">
              ${plan.subject ? `<div class="plan-item__subject">${plan.subject}</div>` : ''}
              <div class="plan-item__task">${plan.task}</div>
            </div>
            <input type="checkbox" class="plan-item__check" ${plan.completed ? 'checked' : ''} aria-label="${plan.task}">
          </li>
        `).join('')}
    </ul>
    <div class="day-notes">
      <div class="day-notes__label">Notlar</div>
      <textarea class="day-notes__input" rows="2" placeholder="Bugün aklında ne var?">${day.notes || ''}</textarea>
    </div>
    <div class="day-study">
      Çalışma <span class="day-study__value">${totalMs > 0 ? formatDurationHuman(totalMs) : '—'}</span>
    </div>
  `;

  card.querySelector('[data-action="add"]').addEventListener('click', (e) => {
    e.stopPropagation();
    onAddPlan(dateKey);
  });

  card.querySelectorAll('.plan-item__check').forEach((checkbox) => {
    checkbox.addEventListener('click', (e) => e.stopPropagation());
    checkbox.addEventListener('change', (e) => {
      const item = e.target.closest('.plan-item');
      const planId = item.dataset.planId;
      togglePlan(state, dateKey, planId);
      item.classList.toggle('is-done', e.target.checked);
    });
  });

  const notesInput = card.querySelector('.day-notes__input');
  notesInput.addEventListener('click', (e) => e.stopPropagation());
  let notesTimeout;
  notesInput.addEventListener('input', () => {
    clearTimeout(notesTimeout);
    notesTimeout = setTimeout(() => {
      setNotes(state, dateKey, notesInput.value);
    }, 400);
  });

  card.addEventListener('click', () => {
    if (window.innerWidth < 1200) {
      onUpdate?.({ selectedDayKey: dateKey });
    }
  });

  return card;
}
