export function initPlanModal(modal, { onSave }) {
  const form = modal.querySelector('#plan-form');
  const cancelBtn = modal.querySelector('#modal-cancel');
  let targetDateKey = null;

  function open(dateKey) {
    targetDateKey = dateKey;
    form.reset();
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    form.querySelector('#plan-time').value = `${hours}:${minutes}`;
    modal.showModal();
    form.querySelector('#plan-task').focus();
  }

  function close() {
    modal.close();
    targetDateKey = null;
  }

  cancelBtn.addEventListener('click', close);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!targetDateKey) return;

    const data = new FormData(form);
    onSave(targetDateKey, {
      time: data.get('time'),
      subject: data.get('subject')?.trim() || '',
      task: data.get('task')?.trim(),
      note: data.get('note')?.trim() || '',
    });
    close();
  });

  return { open, close };
}
