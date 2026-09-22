/* ===== [SHARE] 공유하기 — 링크 공유 · PDF 공유 ===== */

let toastTimer = null;

/** 화면 아래에 잠깐 뜨는 안내 문구 */
export function showToast(message) {
  const toast = document.getElementById('share-toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

// 모바일은 시스템 공유창, 그 외에는 클립보드 복사
async function shareLink() {
  const url = location.href;

  if (navigator.share) {
    try {
      await navigator.share({ title: document.title, url: url });
      return;
    } catch (error) {
      if (error && error.name === 'AbortError') return; // 사용자가 공유창을 닫은 경우
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    showToast('링크를 복사했습니다.');
    return;
  } catch (error) {
    // 클립보드 권한이 없는 환경(구형 브라우저 등)에서는 아래 방식으로 대체
  }

  let copied = false;
  const field = document.createElement('input');
  field.value = url;
  document.body.appendChild(field);
  field.select();
  try {
    copied = document.execCommand('copy');
  } catch (error) {
    copied = false;
  }
  field.remove();
  showToast(copied ? '링크를 복사했습니다.' : url);
}

/**
 * 공유 버튼을 준비한다.
 * @param {{onExportPdf: () => void}} handlers PDF 공유를 눌렀을 때 할 일
 */
export function initShare(handlers) {
  const button = document.getElementById('share-btn');
  const menu = document.getElementById('share-menu');

  const toggleMenu = (open) => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  };

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleMenu(menu.hidden);
  });

  // 메뉴 밖을 누르거나 ESC를 누르면 닫기
  document.addEventListener('click', (event) => {
    if (!menu.hidden && !menu.contains(event.target) && !button.contains(event.target)) {
      toggleMenu(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') toggleMenu(false);
  });

  menu.querySelectorAll('[data-share]').forEach(item => {
    item.addEventListener('click', () => {
      toggleMenu(false);
      if (item.dataset.share === 'link') {
        shareLink();
      } else {
        handlers.onExportPdf();
      }
    });
  });
}
