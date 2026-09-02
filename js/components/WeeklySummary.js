import { getWeekDays, toDateKey, formatDayShort, isToday, parseDateKey } from '../utils/date.js';
import { formatDurationShort, formatDurationHuman } from '../utils/format.js';
import { getDayTotalMs, getCurrentWeekSnapshot, getArchiveWeeks } from '../utils/storage.js';

function renderSummaryBlock(title, dayKeys, dayLabels, dayTotals, weekTotal, { highlightToday = false } = {}) {
  const totals = dayKeys.map((key, i) => ({
    key,
    label: dayLabels[i],
    ms: dayTotals[key] || 0,
    isToday: highlightToday && isToday(parseDateKey(key)),
  }));

  const maxMs = Math.max(...totals.map((t) => t.ms), 1);

  return `
    <div class="weekly-summary__block">
      <h3 class="weekly-summary__subtitle">${title}</h3>
      <div class="weekly-summary__body">
        <div class="weekly-summary__grid" role="img" aria-label="Haftalık çalışma grafiği">
          ${totals.map(({ label, ms, isToday: today }) => {
            const height = ms > 0 ? Math.max((ms / maxMs) * 100, 4) : 2;
            const todayClass = today ? ' is-today' : '';
            return `
              <div class="summary-bar${todayClass}">
                <div class="summary-bar__col" style="height: ${height}%"></div>
                <span class="summary-bar__label">${label}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="weekly-summary__list">
          ${totals.map(({ label, ms, isToday: today }) => {
            const todayClass = today ? ' is-today' : '';
            return `
              <div class="summary-row">
                <span class="summary-row__day${todayClass}">${label}</span>
                <span class="summary-row__time">${formatDurationShort(ms)}</span>
              </div>
            `;
          }).join('')}
          <div class="weekly-summary__total">
            <span class="weekly-summary__total-label">Toplam</span>
            <span class="weekly-summary__total-value">${formatDurationHuman(weekTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderWeeklySummary(container, state) {
  const current = getCurrentWeekSnapshot(state);
  const weekDays = getWeekDays();
  const dayKeys = weekDays.map(toDateKey);
  const dayLabels = weekDays.map(formatDayShort);
  const dayTotals = {};
  dayKeys.forEach((key) => {
    dayTotals[key] = getDayTotalMs(state, key);
  });

  const archives = getArchiveWeeks(state);
  let viewingArchive = container.dataset.viewingArchive || '';

  container.innerHTML = `
    <h2 class="weekly-summary__title">Bu Hafta</h2>
    <div class="weekly-summary__current" id="summary-current">
      ${renderSummaryBlock(
        current.weekLabel,
        dayKeys,
        dayLabels,
        dayTotals,
        current.weekTotal,
        { highlightToday: true }
      )}
    </div>
    ${archives.length > 0 ? `
      <div class="weekly-summary__archive">
        <h3 class="weekly-summary__archive-title">Arşiv</h3>
        <ul class="archive-list" role="list">
          ${archives.map((week) => `
            <li>
              <button type="button" class="archive-list__btn${viewingArchive === week.weekKey ? ' is-active' : ''}" data-week-key="${week.weekKey}">
                ${week.weekLabel}
                <span class="archive-list__time">${formatDurationHuman(week.weekTotal)}</span>
              </button>
            </li>
          `).join('')}
        </ul>
        <div class="weekly-summary__archived" id="summary-archived"></div>
      </div>
    ` : ''}
  `;

  const archivedEl = container.querySelector('#summary-archived');

  function showArchive(weekKey) {
    const week = state.archive[weekKey];
    if (!week || !archivedEl) return;

    container.dataset.viewingArchive = weekKey;
    container.querySelectorAll('.archive-list__btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.weekKey === weekKey);
    });

    archivedEl.innerHTML = renderSummaryBlock(
      week.weekLabel,
      week.dayKeys,
      week.dayLabels,
      week.dayTotals,
      week.weekTotal
    );
    archivedEl.hidden = false;
  }

  container.querySelectorAll('.archive-list__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.weekKey;
      if (container.dataset.viewingArchive === key) {
        container.dataset.viewingArchive = '';
        btn.classList.remove('is-active');
        if (archivedEl) {
          archivedEl.innerHTML = '';
          archivedEl.hidden = true;
        }
      } else {
        showArchive(key);
      }
    });
  });

  if (viewingArchive && state.archive[viewingArchive]) {
    showArchive(viewingArchive);
  }
}
