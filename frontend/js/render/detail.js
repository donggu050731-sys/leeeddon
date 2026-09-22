/* ===== 프로젝트 상세 내용 만들기 =====
   화면 카드 · 상세 모달 · 인쇄용 PDF 문서가 모두 이 함수 하나를 쓴다.
   (같은 내용을 세 곳에 따로 만들지 않기 위해서다.)

   데이터 모양 (backend/data/projects.json)
     meta    : [["분야", "건축·공간 기획"], ...]      → 개요 표
     blocks  : [{ heading, items?, table?, paragraphs?, note?, tags? }, ...]
     source  : "출처: 프로젝트 발표자료"
*/

import { el, append, labeledLine, tagList, table } from '../dom.js';

/** 개요 표 (분야 · 형태 · 과목 …) */
function metaList(meta) {
  const list = el('dl', 'detail-meta');
  meta.forEach(pair => {
    list.appendChild(el('dt', null, pair[0]));
    list.appendChild(el('dd', null, pair[1]));
  });
  return list;
}

/** 소제목 하나와 그 아래 내용 (순서: 목록 → 표 → 설명 → 참고 → 키워드) */
function detailBlock(block) {
  const wrap = el('div', 'detail-block');
  wrap.appendChild(el('h4', null, block.heading));

  if (block.items && block.items.length) {
    const list = el('ul');
    block.items.forEach(item => list.appendChild(labeledLine('li', item)));
    wrap.appendChild(list);
  }

  if (block.table) {
    const scroll = el('div', 'table-wrap');
    scroll.appendChild(table('detail-table', block.table.headers, block.table.rows));
    wrap.appendChild(scroll);
  }

  if (block.paragraphs && block.paragraphs.length) {
    block.paragraphs.forEach(paragraph => wrap.appendChild(labeledLine('p', paragraph)));
  }

  if (block.note) {
    wrap.appendChild(el('p', 'detail-note', block.note));
  }

  if (block.tags && block.tags.length) {
    wrap.appendChild(tagList(block.tags));
  }

  return wrap;
}

/**
 * 프로젝트 1건의 상세 내용을 통째로 만든다.
 * @param {object} project projects.json 의 항목 하나
 * @returns {DocumentFragment}
 */
export function createProjectDetail(project) {
  const fragment = document.createDocumentFragment();

  if (project.meta && project.meta.length) {
    fragment.appendChild(metaList(project.meta));
  }

  (project.blocks || []).forEach(block => fragment.appendChild(detailBlock(block)));

  if (project.source) {
    fragment.appendChild(el('p', 'detail-source', project.source));
  }

  return fragment;
}

/** 개요 표에서 값 하나를 찾아온다. 예: metaValue(project, ['과목', '구분']) */
export function metaValue(project, keys) {
  const found = (project.meta || []).find(pair => keys.indexOf(pair[0]) !== -1);
  return found ? found[1] : '';
}
