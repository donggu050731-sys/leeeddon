/* ===== 캘린더 (날짜 고르기) =====
   한 달씩 보여주고, 고를 수 있는 날짜만 누를 수 있다.
   "어떤 날짜를 고를 수 있는지"는 이 파일이 정하지 않는다. 밖에서 받은 statusOf() 에 묻는다.
*/

import { el, append } from '../dom.js';

const pad = (number) => String(number).padStart(2, '0');

/**
 * @param {object} options
 * @param {string[]} options.weekdays 요일 이름 7개 (일요일부터)
 * @param {string} options.prevLabel 이전 달 버튼 설명
 * @param {string} options.nextLabel 다음 달 버튼 설명
 * @param {string} options.today 오늘 (YYYY-MM-DD)
 * @param {string} options.lastDate 고를 수 있는 마지막 날 (YYYY-MM-DD)
 * @param {(date: string) => string|null} options.statusOf 고를 수 없는 이유. null 이면 고를 수 있다
 * @param {(date: string) => string} options.titleOf 날짜에 마우스를 올렸을 때 보일 설명 (공휴일 이름 등)
 * @param {(date: string) => void} options.onSelect 날짜를 눌렀을 때
 * @returns {{element: HTMLElement, clear: () => void}}
 */
export function createCalendar(options) {
  const { weekdays, today, lastDate, statusOf, titleOf, onSelect } = options;
  const firstMonth = today.slice(0, 7);
  const lastMonth = lastDate.slice(0, 7);

  let month = firstMonth; // 지금 보고 있는 달 (YYYY-MM)
  let selected = '';

  const root = el('div', 'calendar');
  const title = el('p', 'calendar-title');
  title.setAttribute('aria-live', 'polite');
  const prev = el('button', 'calendar-nav', '‹');
  const next = el('button', 'calendar-nav', '›');
  prev.type = next.type = 'button';
  prev.setAttribute('aria-label', options.prevLabel);
  next.setAttribute('aria-label', options.nextLabel);

  const head = el('div', 'calendar-head');
  append(head, prev, title, next);

  const grid = el('div', 'calendar-grid');
  append(root, head, grid);

  function shiftMonth(step) {
    const [year, index] = month.split('-').map(Number);
    const value = new Date(Date.UTC(year, index - 1 + step, 1));
    month = value.getUTCFullYear() + '-' + pad(value.getUTCMonth() + 1);
    draw();
  }

  function draw() {
    const [year, index] = month.split('-').map(Number);
    const firstDay = new Date(Date.UTC(year, index - 1, 1)).getUTCDay();
    const days = new Date(Date.UTC(year, index, 0)).getUTCDate();

    title.textContent = year + '년 ' + index + '월';
    prev.disabled = month <= firstMonth;
    next.disabled = month >= lastMonth;

    const cells = weekdays.map(name => el('span', 'calendar-weekday', name));
    for (let blank = 0; blank < firstDay; blank += 1) cells.push(el('span', 'calendar-blank'));

    for (let day = 1; day <= days; day += 1) {
      const date = month + '-' + pad(day);
      const status = statusOf(date);
      const button = el('button', 'calendar-day', String(day));
      button.type = 'button';
      button.disabled = status !== null;
      if (status) button.classList.add('is-' + status);
      if (date === today) button.classList.add('is-today');
      if (date === selected) {
        button.classList.add('is-selected');
        button.setAttribute('aria-pressed', 'true');
      }
      const hint = titleOf(date);
      if (hint) button.title = hint;

      button.addEventListener('click', () => {
        selected = date;
        draw();
        onSelect(date);
      });
      cells.push(button);
    }

    grid.replaceChildren(...cells);
  }

  prev.addEventListener('click', () => shiftMonth(-1));
  next.addEventListener('click', () => shiftMonth(1));
  draw();

  return {
    element: root,
    /** 고른 날짜를 지운다 (예약을 마친 뒤) */
    clear() {
      selected = '';
      draw();
    }
  };
}
