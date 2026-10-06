/* ===== 관리자 화면: 예약하기 관리 =====
   방문 예약을 표로 보여주고, 예약마다 처리 상태(접수 · 확정 · 변경 요청 · 취소)를 바꾼다.
   표 위에는 상태별 건수 요약과, 한 가지 상태만 골라 보는 필터가 있다.

   예약 번호는 '신청자(이름·이메일) + 방문 희망 시간' 한 묶음마다 하나씩 붙는다.
   같은 사람이 다른 시간에 또 신청하면 새 번호를 받는다. (번호를 붙이는 일은 서버가 한다)
*/

import * as api from './api.js';

// 처리 상태 4가지 — [서버에 저장되는 값, 화면에 보이는 이름]
const STATUSES = [
  ['requested', '접수'],
  ['confirmed', '확정'],
  ['change-requested', '변경 요청'],
  ['cancelled', '취소']
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const body = document.getElementById('booking-rows');
const empty = document.getElementById('booking-empty');
const message = document.getElementById('booking-message');
const summary = document.getElementById('booking-summary');
const filters = document.getElementById('booking-filters');

const ALL = 'all';   // 필터를 걸지 않은 상태

let bookings = [];
let filter = ALL;    // 지금 골라 보고 있는 처리 상태
let onFailure = async () => false;

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = text;
  return element;
}

function setMessage(text, ok) {
  message.textContent = text;
  message.classList.toggle('ok', Boolean(ok));
}

function statusLabel(status) {
  return (STATUSES.find(([value]) => value === status) || [null, status])[1];
}

/** 예약 번호를 네 자리로 보여준다. 예: 7 → 0007 */
function formatNumber(number) {
  return number ? String(number).padStart(4, '0') : '-';
}

/** 예: 2026-10-13 → 2026.10.13 (화) */
function formatDate(date) {
  const day = new Date(date + 'T00:00:00Z').getUTCDay();
  return date.replaceAll('-', '.') + ' (' + WEEKDAYS[day] + ')';
}

// 관리 칸: 상태 4가지를 버튼으로 고른다. 지금 상태인 버튼은 눌린 모양으로 보인다.
function statusButtons(booking) {
  const group = el('div', 'status-buttons');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', '처리 상태 바꾸기');

  STATUSES.forEach(([value, label]) => {
    const current = booking.status === value;
    const button = el('button', 'status-button ' + value + (current ? ' current' : ''), label);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(current));
    button.addEventListener('click', () => changeStatus(booking, value, group));
    group.appendChild(button);
  });

  return group;
}

function row(booking) {
  const line = el('tr');

  const who = el('td');
  who.append(el('strong', 'booking-name', booking.name), el('span', 'booking-email', booking.email));

  const when = el('td', 'booking-when');
  when.append(el('span', null, formatDate(booking.date)), el('strong', null, booking.time));

  const status = el('td');
  status.appendChild(el('span', 'badge booking-status ' + booking.status, statusLabel(booking.status)));

  const manage = el('td');
  manage.appendChild(statusButtons(booking));

  line.append(
    el('td', 'booking-number', formatNumber(booking.no)),
    who,
    when,
    el('td', 'booking-purpose', booking.purpose),
    status,
    manage
  );
  return line;
}

function countOf(status) {
  return bookings.filter(booking => booking.status === status).length;
}

// 요약 문장. 예: 전체 5건 / 접수 2건 / 확정 1건 / 변경 요청 1건 / 취소 1건
function renderSummary() {
  const parts = [['전체', bookings.length], ...STATUSES.map(([value, label]) => [label, countOf(value)])];

  summary.replaceChildren();
  parts.forEach(([label, number], index) => {
    if (index > 0) summary.appendChild(document.createTextNode(' / '));
    summary.append(label + ' ', el('strong', null, String(number)), '건');
  });
}

// 필터 버튼: 전체 + 상태 4가지. 지금 고른 것은 눌린 모양으로 보인다.
function renderFilters() {
  const options = [[ALL, '전체'], ...STATUSES];

  filters.replaceChildren(...options.map(([value, label]) => {
    const button = el('button', 'filter-button', label);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(filter === value));
    button.addEventListener('click', () => {
      filter = value;
      render();
    });
    return button;
  }));
}

function render() {
  const shown = filter === ALL ? bookings : bookings.filter(booking => booking.status === filter);

  renderSummary();
  renderFilters();
  body.replaceChildren(...shown.map(row));

  empty.hidden = shown.length > 0;
  empty.textContent = bookings.length === 0
    ? '아직 들어온 예약이 없습니다.'
    : '‘' + statusLabel(filter) + '’ 상태인 예약이 없습니다.';
}

async function changeStatus(booking, status, group) {
  if (booking.status === status) return;

  group.querySelectorAll('button').forEach(button => { button.disabled = true; });
  try {
    const updated = await api.setBookingStatus(booking.id, status);
    bookings = bookings.map(item => (item.id === updated.id ? updated : item));
    render();
    setMessage('예약 ' + formatNumber(updated.no) + ' 을(를) ‘' + statusLabel(status) + '’(으)로 바꿨습니다.', true);
  } catch (error) {
    render();
    if (!(await onFailure(error))) setMessage(error.message);
  }
}

/** 서버에서 예약 목록을 다시 받아 표를 그린다 (탭을 누를 때마다 불린다) */
export async function loadBookings() {
  setMessage('');
  try {
    bookings = await api.listBookings();
    render();
  } catch (error) {
    if (!(await onFailure(error))) setMessage(error.message);
  }
}

/** @param {(error: Error) => Promise<boolean>} handleFailure 로그인이 풀린 경우 등을 처리하는 함수 */
export function initBookings(handleFailure) {
  onFailure = handleFailure;
  document.getElementById('booking-refresh').addEventListener('click', loadBookings);
}
