// Filter logic
const filterBtns = document.querySelectorAll('.filter-btn');
const groups = document.querySelectorAll('.sample-group');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    const filter = btn.dataset.filter;
    groups.forEach(g => {
      g.style.display = (filter === 'all' || g.dataset.category === filter) ? 'block' : 'none';
    });
  });
});
