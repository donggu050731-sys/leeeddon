/* ===== 시작점 =====
   ① 데이터를 가져오고 → ② 화면을 그리고 → ③ 동작(메뉴·모달·공유)을 연결한다.
   내용 자체는 backend/data/*.json 에 있다. 이 파일에는 문장을 적지 않는다.
*/

import { loadPortfolio } from './api.js';
import { renderLogo, renderHero, renderAbout, renderFooter } from './render/sections.js';
import { renderProjects } from './render/projects.js';
import { renderHometown } from './render/hometown.js';
import { renderJourney } from './render/journey.js';
import { initNav } from './ui/nav.js';
import { observeFadeIn } from './ui/animations.js';
import { initProjectModal, closeProjectModal } from './ui/modal.js';
import { initShare, showToast } from './ui/share.js';
import { buildPdfDocument } from './pdf.js';

function renderAll(data) {
  renderLogo(document.getElementById('nav-logo'), data.profile);
  renderHero(document.getElementById('hero'), data.profile);
  renderAbout(document.getElementById('about'), data.profile);
  renderProjects(document.getElementById('projects'), data.projects);
  renderHometown(document.getElementById('suwon'), data.hometown);
  renderJourney(document.getElementById('journey'), data.journey);
  renderFooter(document.getElementById('footer'), data.profile);
}

function exportPdf(data) {
  closeProjectModal();
  buildPdfDocument(data);
  showToast('인쇄 창에서 대상(프린터)을 “PDF로 저장”으로 선택하세요.');
  window.print();
}

// 데이터를 못 불러왔을 때, 빈 화면 대신 이유를 보여준다
function showLoadError(error) {
  console.error('[main] 데이터를 불러오지 못했습니다.', error);
  const hero = document.getElementById('hero');
  const box = document.createElement('div');
  box.className = 'load-error';
  const title = document.createElement('h1');
  title.textContent = '내용을 불러오지 못했습니다';
  const desc = document.createElement('p');
  desc.textContent = '백엔드 서버(npm start)가 켜져 있는지, 또는 data 폴더의 JSON 파일이 있는지 확인해 주세요.';
  const detail = document.createElement('p');
  detail.className = 'load-error-detail';
  detail.textContent = String(error && error.message ? error.message : error);
  box.append(title, desc, detail);
  hero.replaceChildren(box);
}

async function start() {
  let data;
  try {
    data = await loadPortfolio();
  } catch (error) {
    showLoadError(error);
    return;
  }

  renderAll(data);

  initNav();
  observeFadeIn();
  initProjectModal();
  initShare({ onExportPdf: () => exportPdf(data) });

  // Ctrl+P·브라우저 인쇄로 들어와도 같은 구조화 문서가 나오도록 미리 만들어 둔다
  buildPdfDocument(data);
  window.addEventListener('beforeprint', () => buildPdfDocument(data));
}

start();
