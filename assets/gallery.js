// Shared by /location and /summer: background fade-in, photo fade-in, lightbox.

// Background fade-in
(function(){
  var bg = document.getElementById('bgImg');
  function show(){ bg.classList.add('loaded'); }
  if (bg.complete && bg.naturalWidth > 0) requestAnimationFrame(show);
  else if (bg.decode) bg.decode().then(show).catch(function(){ bg.addEventListener('load', show, {once:true}); });
  else bg.addEventListener('load', show, {once:true});
})();

var items = Array.from(document.querySelectorAll('.photo-item'));

// Photo fade-in on load; a slot whose file is missing becomes an empty frame.
items.forEach(function(item){
  var img = item.querySelector('img');
  function onLoad(){ img.classList.add('loaded'); }
  function onError(){ item.classList.add('pending'); }
  if (img.complete) {
    if (img.naturalWidth > 0) requestAnimationFrame(onLoad); else onError();
  } else {
    img.addEventListener('load', onLoad, {once:true});
    img.addEventListener('error', onError, {once:true});
  }
});

// Lightbox — steps only through photos that actually loaded.
var lightbox  = document.getElementById('lightbox');
var lbImg     = document.getElementById('lbImg');
var lbClose   = document.getElementById('lbClose');
var lbPrev    = document.getElementById('lbPrev');
var lbNext    = document.getElementById('lbNext');
var lbCounter = document.getElementById('lbCounter');
var shown     = [];
var current   = 0;

function updateNav(){
  lbPrev.disabled = current === 0;
  lbNext.disabled = current === shown.length - 1;
  lbCounter.textContent = (current + 1) + ' / ' + shown.length;
}
function showPhoto(){
  var img = shown[current].querySelector('img');
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  updateNav();
}
function openLightbox(item){
  shown = items.filter(function(el){ return !el.classList.contains('pending'); });
  current = shown.indexOf(item);
  if (current < 0) return;
  showPhoto();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox(){
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}
function prev(){ if (current > 0){ current--; showPhoto(); } }
function next(){ if (current < shown.length - 1){ current++; showPhoto(); } }

items.forEach(function(item){
  item.addEventListener('click', function(){ openLightbox(item); });
});

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', prev);
lbNext.addEventListener('click', next);
lightbox.addEventListener('click', function(e){ if (e.target === lightbox || e.target.classList.contains('lb-img-wrap')) closeLightbox(); });
document.addEventListener('keydown', function(e){
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   prev();
  if (e.key === 'ArrowRight')  next();
});
