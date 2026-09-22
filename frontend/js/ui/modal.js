/* ===== 프로젝트 상세 모달 =====
   카드 안에 숨겨둔 상세 내용을 복사해서 보여준다.
   (원본은 카드에 그대로 남아 있어야 인쇄용 문서에서도 쓸 수 있다.)
*/

let modal = null;

function openProject(card) {
  const title = card.querySelector('.project-title').textContent;
  const detail = card.querySelector('.project-detail');

  modal.querySelector('.modal-title').textContent = title;
  modal.querySelector('.modal-body').replaceChildren(...
    Array.from(detail.cloneNode(true).children)
  );

  modal.showModal();
  modal.scrollTop = 0;
  document.body.classList.add('modal-open');
}

/** 모달을 준비한다. 카드를 다시 그린 뒤에 불러야 버튼이 연결된다. */
export function initProjectModal() {
  modal = document.getElementById('project-modal');

  document.querySelectorAll('.project-open').forEach(button => {
    button.addEventListener('click', () => openProject(button.closest('.project-card')));
  });

  modal.querySelector('.modal-close').addEventListener('click', () => modal.close());

  // 어두운 배경을 누르면 닫기 (ESC 키는 브라우저가 기본으로 처리)
  modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.close();
  });

  modal.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
  });
}

/** 인쇄 직전처럼 모달을 닫아야 할 때 쓴다. */
export function closeProjectModal() {
  if (modal && modal.open) modal.close();
}
