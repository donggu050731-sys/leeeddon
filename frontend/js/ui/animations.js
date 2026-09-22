/* ===== 스크롤에 맞춰 나타나는 효과 =====
   내용을 JS가 그린 뒤에 불러야 한다 (그려지기 전에는 대상이 없다).
*/

/** .fade-in 요소가 화면에 들어오면 보이게 한다. */
export function observeFadeIn(root = document) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  root.querySelectorAll('.fade-in').forEach(element => observer.observe(element));
}
