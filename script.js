// small interactivity
const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
document.getElementById('themeToggle').addEventListener('click', ()=>{
  document.documentElement.classList.toggle('light');
});
// Smooth scroll for in-page anchors
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
});
