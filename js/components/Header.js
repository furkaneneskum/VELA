import { formatWeekRange } from '../utils/date.js';

export function renderHeader(container, { onToday, onAddPlan }) {
  const weekRange = formatWeekRange();

  container.innerHTML = `
    <div class="header__brand">
      <h1 class="header__title">VELA</h1>
      <p class="header__week">${weekRange}</p>
    </div>
    <div class="header__actions">
      <button type="button" class="btn btn--today" id="btn-today">Bugün</button>
      <button type="button" class="btn btn--accent" id="btn-add-plan">+ Plan Ekle</button>
    </div>
  `;

  container.querySelector('#btn-today').addEventListener('click', onToday);
  container.querySelector('#btn-add-plan').addEventListener('click', onAddPlan);
}
