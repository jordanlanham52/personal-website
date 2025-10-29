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

// Open user's email client with prefilled message instead of posting to a 3rd-party form
function mailtoSubmit(e){
  e.preventDefault();
  const form = e.target;
  const name = (form.elements['name'] && form.elements['name'].value) ? form.elements['name'].value.trim() : '';
  const email = (form.elements['email'] && form.elements['email'].value) ? form.elements['email'].value.trim() : '';
  const subject = (form.elements['subject'] && form.elements['subject'].value) ? form.elements['subject'].value.trim() : 'Website inquiry';
  const message = (form.elements['message'] && form.elements['message'].value) ? form.elements['message'].value.trim() : '';
  const pgp = (form.elements['pgp'] && form.elements['pgp'].value) ? form.elements['pgp'].value.trim() : '';

  let body = '';
  if(name) body += `Name: ${name}\n`;
  if(email) body += `Email: ${email}\n\n`;
  if(message) body += `Message:\n${message}\n\n`;
  if(pgp) body += `PGP:\n${pgp}\n\n`;
  body += '--\nSent from jordanlanham.com';

  const maxLen = 1500; // reasonable guard for mailto length
  const mailto = `mailto:contact@jordanlanham.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if(mailto.length > 1900){
    // Too long for some clients — ask user to paste manually
    alert('The message is too long to open in your email client. Please copy the message and email contact@jordanlanham.com directly.');
    return;
  }
  window.location.href = mailto;
}
