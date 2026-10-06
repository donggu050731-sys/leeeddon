/* ===== 방문 예약 그리기 (캘린더 · 입력 칸 · 동의 · 확인 팝업) =====
   문구는 backend/data/visit.json 의 booking, 공휴일은 holidays.json 에서 온다.
   고를 수 있는 날짜·시간의 규칙은 booking-rules.js 에 있다.

   흐름: 칸을 모두 채우고 동의에 체크 → [예약하기] 활성화 → 확인 팝업 → 팝업의 [예약하기] → 저장
*/

import { el, append, sectionHeader } from '../dom.js';
import { createCalendar } from '../ui/calendar.js';
import { todayString, addDays, dateStatus, timeSlots, isEmail, formatDate } from '../booking-rules.js';

/** 라벨 + 입력 칸 한 묶음. 필수 칸에는 * 표시를 붙인다 */
function field(id, label, control, requiredMark) {
  const wrap = el('div', 'form-field');
  const name = el('label', 'form-label', label);
  name.htmlFor = id;
  const mark = el('span', 'form-required', '*');
  mark.title = requiredMark;
  name.appendChild(mark);
  control.id = id;
  append(wrap, name, control);
  return wrap;
}

function textInput(type, config) {
  const input = el(type === 'textarea' ? 'textarea' : 'input', 'form-input');
  if (type !== 'textarea') input.type = type;
  input.placeholder = config.placeholder;
  input.maxLength = config.max;
  input.required = true;
  return input;
}

/**
 * 예약 페이지 전체를 그린다.
 * @param {HTMLElement} section
 * @param {object} booking visit.json 의 booking
 * @param {{source: object, items: {date: string, name: string}[]}} holidays
 * @param {object} options
 * @param {HTMLDialogElement} options.modal 확인 팝업
 * @param {(payload: object) => Promise<void>} options.onSubmit 팝업에서 최종 [예약하기]를 눌렀을 때
 */
export function renderBooking(section, booking, holidays, { modal, onSubmit }) {
  const { fields, rules, calendar: labels } = booking;
  const today = todayString();
  const limits = { today, maxDaysAhead: rules.maxDaysAhead, holidays: holidays.items };
  const state = { date: '', time: '', name: '', email: '', purpose: '', consent: false };

  /* --- 왼쪽: 캘린더 · 선택한 날짜 · 희망 시간 --- */
  const dateBox = el('output', 'form-input booking-date-box is-empty', fields.date.empty);

  const picker = createCalendar({
    weekdays: labels.weekdays,
    prevLabel: labels.prev,
    nextLabel: labels.next,
    today,
    lastDate: addDays(today, rules.maxDaysAhead),
    statusOf: date => dateStatus(date, limits),
    titleOf: date => (holidays.items.find(item => item.date === date) || {}).name || '',
    onSelect(date) {
      state.date = date;
      dateBox.textContent = formatDate(date, labels.weekdays);
      dateBox.classList.remove('is-empty');
      refresh();
    }
  });

  const source = el('p', 'booking-note', labels.hint + ' ' + labels.holidaySourcePrefix + ': ');
  const sourceLink = el('a', null, holidays.source.name);
  sourceLink.href = holidays.source.href;
  sourceLink.target = '_blank';
  sourceLink.rel = 'noopener noreferrer';
  source.appendChild(sourceLink);

  const timeSelect = el('select', 'form-input');
  timeSelect.required = true;
  const emptyOption = el('option', null, fields.time.empty);
  emptyOption.value = '';
  timeSelect.appendChild(emptyOption);
  timeSlots(rules).forEach(slot => timeSelect.appendChild(el('option', null, slot)));

  const left = el('div', 'visit-card booking-card fade-in');
  append(
    left,
    el('p', 'visit-card-title', labels.title),
    picker.element,
    source,
    field('booking-date', fields.date.label, dateBox, booking.requiredMark),
    field('booking-time', fields.time.label, timeSelect, booking.requiredMark)
  );

  /* --- 오른쪽: 이름 · 이메일 · 방문 목적 --- */
  const nameInput = textInput('text', fields.name);
  nameInput.autocomplete = 'name';
  const emailInput = textInput('email', fields.email);
  emailInput.autocomplete = 'email';
  const purposeInput = textInput('textarea', fields.purpose);
  purposeInput.classList.add('booking-purpose');

  const emailError = el('p', 'form-error', fields.email.error);
  emailError.id = 'booking-email-error';
  emailError.hidden = true;
  const emailField = field('booking-email', fields.email.label, emailInput, booking.requiredMark);
  emailField.appendChild(emailError);
  emailInput.setAttribute('aria-describedby', emailError.id);

  const right = el('div', 'visit-card booking-card fade-in');
  append(
    right,
    field('booking-name', fields.name.label, nameInput, booking.requiredMark),
    emailField,
    field('booking-purpose', fields.purpose.label, purposeInput, booking.requiredMark)
  );

  /* --- 아래: 동의 체크 + 예약하기 버튼 --- */
  const consentInput = el('input');
  consentInput.type = 'checkbox';
  const consent = el('label', 'booking-consent');
  append(consent, consentInput, el('span', null, booking.consent));

  const submit = el('button', 'hero-cta booking-submit', booking.submitText);
  submit.type = 'submit';
  submit.disabled = true;

  const actions = el('div', 'booking-actions fade-in');
  append(actions, consent, submit);

  const grid = el('div', 'booking-grid');
  append(grid, left, right);

  const form = el('form', 'booking-form');
  form.noValidate = true;
  append(form, grid, actions);

  const back = el('p', 'visit-booking fade-in');
  const backLink = el('a', 'visit-map-link', '← ' + booking.backText);
  backLink.href = booking.backHref;
  back.appendChild(backLink);

  section.replaceChildren(sectionHeader(booking.label, booking.title, booking.desc), form, back);

  /* --- 입력이 바뀔 때마다: 이메일 안내와 버튼 활성화를 다시 정한다 --- */
  function refresh() {
    state.time = timeSelect.value;
    state.name = nameInput.value.trim();
    state.email = emailInput.value.trim();
    state.purpose = purposeInput.value.trim();
    state.consent = consentInput.checked;

    // 이메일: 무언가 적었는데 모양이 틀리면 빨간 테두리 + 칸 아래 안내
    const emailWrong = state.email !== '' && !isEmail(state.email);
    emailInput.classList.toggle('is-invalid', emailWrong);
    emailInput.setAttribute('aria-invalid', String(emailWrong));
    emailError.hidden = !emailWrong;

    const ready = Boolean(state.date && state.time && state.name && state.purpose)
      && isEmail(state.email) && state.consent;
    submit.disabled = !ready;
    return ready;
  }

  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);

  /* --- 확인 팝업 --- */
  const modalTitle = modal.querySelector('.modal-title');
  const modalBody = modal.querySelector('.modal-body');

  function summaryRow(list, label, value) {
    append(list, el('dt', null, label), el('dd', null, value));
  }

  function openConfirm() {
    const list = el('dl', 'booking-summary');
    summaryRow(list, fields.date.label, formatDate(state.date, labels.weekdays));
    summaryRow(list, fields.time.label, state.time);
    summaryRow(list, fields.name.label, state.name);
    summaryRow(list, fields.email.label, state.email);
    summaryRow(list, fields.purpose.label, state.purpose);

    const status = el('p', 'booking-modal-status');
    status.setAttribute('role', 'status');

    const cancel = el('button', 'booking-button-plain', booking.confirm.cancelText);
    cancel.type = 'button';
    cancel.addEventListener('click', () => modal.close());

    const confirm = el('button', 'hero-cta booking-submit', booking.confirm.submitText);
    confirm.type = 'button';
    confirm.addEventListener('click', async () => {
      confirm.disabled = cancel.disabled = true;
      status.classList.remove('is-error');
      status.textContent = booking.confirm.sending;
      try {
        await onSubmit({ ...state });
        showDone();
      } catch (error) {
        console.warn('[booking] 예약을 저장하지 못했습니다.', error);
        status.classList.add('is-error');
        status.textContent = error.userMessage || booking.fail;
        confirm.disabled = cancel.disabled = false;
      }
    });

    const buttons = el('div', 'booking-modal-actions');
    append(buttons, cancel, confirm);

    modalTitle.textContent = booking.confirm.title;
    modalBody.replaceChildren(el('p', 'booking-modal-desc', booking.confirm.desc), list, status, buttons);
    modal.showModal();
    document.body.classList.add('modal-open');
  }

  // 저장이 끝나면: 팝업에 완료 안내를 보여주고, 입력 칸을 모두 비운다
  function showDone() {
    const close = el('button', 'hero-cta booking-submit', booking.done.closeText);
    close.type = 'button';
    close.addEventListener('click', () => modal.close());

    const buttons = el('div', 'booking-modal-actions');
    buttons.appendChild(close);

    modalTitle.textContent = booking.done.title;
    modalBody.replaceChildren(el('p', 'booking-modal-desc', booking.done.desc), buttons);

    form.reset();
    picker.clear();
    state.date = '';
    dateBox.textContent = fields.date.empty;
    dateBox.classList.add('is-empty');
    refresh();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (refresh()) openConfirm();
  });

  modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
  modal.addEventListener('close', () => document.body.classList.remove('modal-open'));
}
