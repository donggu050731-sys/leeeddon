/* ===== 화면 요소를 만드는 작은 도구들 =====
   innerHTML 대신 이 함수들로 요소를 만든다. 데이터에 들어 있는 글자가 그대로 글자로만 표시되어
   (HTML 태그로 해석되지 않아) 안전하고, 나중에 DB에서 받아온 내용도 그대로 쓸 수 있다.
*/

/**
 * 요소 하나를 만든다.
 * @param {string} tag 태그 이름
 * @param {string|null} className 클래스 (없으면 null)
 * @param {string|null} text 글자 내용 (없으면 생략)
 */
export function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = text;
  return element;
}

/** 여러 요소를 한 번에 붙인다. */
export function append(parent, ...children) {
  children.filter(Boolean).forEach(child => parent.appendChild(child));
  return parent;
}

/** 섹션 위쪽의 제목 묶음 (작은 라벨 + 제목 + 설명) */
export function sectionHeader(label, title, desc) {
  const header = el('div', 'section-header fade-in');
  append(
    header,
    label ? el('p', 'section-label', label) : null,
    title ? el('h2', 'section-title', title) : null,
    desc ? el('p', 'section-desc', desc) : null
  );
  return header;
}

/**
 * "라벨: 내용" 형태의 글줄. 라벨이 있으면 굵게 보여준다.
 * @param {string} tag 만들 태그 (li 또는 p)
 * @param {{label?: string, text: string}} item
 */
export function labeledLine(tag, item) {
  const line = el(tag);
  if (item.label) {
    line.appendChild(el('strong', null, item.label + ':'));
    line.appendChild(document.createTextNode(' ' + item.text));
  } else {
    line.textContent = item.text;
  }
  return line;
}

/** 태그 모양의 목록 (예: 키워드) */
export function tagList(tags) {
  const list = el('ul', 'tag-list');
  tags.forEach(tag => list.appendChild(el('li', null, tag)));
  return list;
}

/**
 * 표를 만든다.
 * @param {string} className 표에 줄 클래스
 * @param {string[]} headers 머리글
 * @param {string[][]} rows 내용 줄
 */
export function table(className, headers, rows) {
  const element = el('table', className);

  if (headers && headers.length) {
    const head = el('thead');
    const headRow = el('tr');
    headers.forEach(label => headRow.appendChild(el('th', null, label)));
    head.appendChild(headRow);
    element.appendChild(head);
  }

  const body = el('tbody');
  rows.forEach(cells => {
    const row = el('tr');
    cells.forEach(cell => row.appendChild(el('td', null, cell)));
    body.appendChild(row);
  });
  element.appendChild(body);

  return element;
}
