// "Stay connected" mailing-list sign-up, fixed bottom-left.
// Include with <script src="/assets/signup.js" defer></script>. Posts to the
// Apps Script web app in _mailing-list/, which stores the address in the
// "Stella mailing list" sheet and sends the thank-you email.
(function () {
  // The Apps Script web app URL (ends in /exec). Filled in after it is deployed.
  var ENDPOINT = '';
  if (!ENDPOINT) return; // stays hidden until the backend is deployed

  var css = [
    '.signup { position: fixed; left: 42px; bottom: 38px; z-index: 4; color: #fff;',
    "  font-family: 'Tofth Grotesk Mono', ui-monospace, 'SF Mono', Menlo, monospace;",
    '  text-shadow: 0 1px 12px rgba(0,0,0,0.5); animation: signup-fade 1.4s ease 0.4s both;',
    '  transition: opacity 0.35s ease, filter 0.35s ease; }',
    '@keyframes signup-fade { from { opacity: 0; } to { opacity: 1; } }',
    '.signup.hidden { opacity: 0; filter: blur(8px); pointer-events: none; }',
    // Soft shade in the corner, mirroring the top-left vignette, so the text reads over bright water.
    '.signup-shade { position: fixed; inset: 0; z-index: 1; pointer-events: none;',
    '  background: radial-gradient(ellipse 70% 45% at 0% 100%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0) 100%); }',
    '.signup-toggle { background: none; border: none; padding: 0; color: #fff; cursor: pointer;',
    '  font: inherit; font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase;',
    '  display: inline-flex; align-items: center; gap: 12px; opacity: 0.9;',
    '  transition: opacity 0.2s ease, gap 0.25s ease; text-shadow: inherit; }',
    '.signup-toggle::after { content: ""; width: 22px; height: 1px; background: rgba(255,255,255,0.75); transition: width 0.25s ease; }',
    '.signup-toggle:hover { opacity: 1; gap: 16px; }',
    '.signup-toggle:hover::after { width: 32px; }',
    '.signup form { display: none; align-items: center; gap: 10px; }',
    '.signup.open .signup-toggle { display: none; }',
    '.signup.open form { display: flex; animation: signup-fade 0.4s ease both; }',
    '.signup input { width: 230px; max-width: calc(100vw - 100px); background: transparent; border: none;',
    '  border-bottom: 1px solid rgba(255,255,255,0.6); border-radius: 0; color: #fff; font: inherit;',
    '  font-size: 12px; letter-spacing: 0.04em; padding: 6px 0; outline: none; text-shadow: inherit; }',
    '.signup input::placeholder { color: rgba(255,255,255,0.55); }',
    '.signup input:focus { border-bottom-color: #fff; }',
    '.signup .hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }',
    '.signup-send { background: none; border: none; color: #fff; cursor: pointer; font: inherit;',
    '  font-size: 16px; line-height: 1; padding: 4px 2px; opacity: 0.8; transition: opacity 0.2s, transform 0.2s; text-shadow: inherit; }',
    '.signup-send:hover { opacity: 1; transform: translateX(3px); }',
    '.signup-send:disabled { opacity: 0.35; cursor: default; transform: none; }',
    '.signup-msg { font-size: 11px; letter-spacing: 0.06em; line-height: 1.5; margin-top: 8px; max-width: calc(100vw - 44px); color: rgba(255,255,255,0.85); }',
    '.signup-msg:empty { display: none; }',
    '.signup .signup-toggle:focus-visible, .signup-send:focus-visible { outline: 1px dashed rgba(255,255,255,0.8); outline-offset: 6px; }',
    '@media (max-width: 600px) {',
    '  .signup { left: 22px; bottom: calc(24px + env(safe-area-inset-bottom)); }',
    '  .signup input { width: 200px; font-size: 16px; }', // 16px stops iOS zooming in on focus
    '}'
  ].join('\n');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var box = document.createElement('div');
  box.className = 'signup';
  box.innerHTML =
    '<button type="button" class="signup-toggle" aria-expanded="false">Stay connected</button>' +
    '<form novalidate>' +
      '<label class="hp" aria-hidden="true">Website <input name="website" tabindex="-1" autocomplete="off"></label>' +
      '<input type="email" name="email" placeholder="Your email" aria-label="Your email" autocomplete="email" required>' +
      '<button type="submit" class="signup-send" aria-label="Join the mailing list">→</button>' +
    '</form>' +
    '<div class="signup-msg" role="status" aria-live="polite"></div>';
  var shade = document.createElement('div');
  shade.className = 'signup-shade';
  shade.setAttribute('aria-hidden', 'true');
  document.body.appendChild(shade);
  document.body.appendChild(box);

  var toggle = box.querySelector('.signup-toggle');
  var form = box.querySelector('form');
  var input = form.querySelector('input[name="email"]');
  var send = form.querySelector('.signup-send');
  var msg = box.querySelector('.signup-msg');

  toggle.addEventListener('click', function () {
    box.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    input.focus();
  });

  // Close again if left empty and the visitor clicks elsewhere or presses Escape.
  function collapse() {
    if (input.value || box.classList.contains('done')) return;
    box.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    msg.textContent = '';
  }
  document.addEventListener('click', function (e) { if (!box.contains(e.target)) collapse(); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { input.value = ''; collapse(); toggle.focus(); } });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      msg.textContent = 'Please check the address.';
      input.focus();
      return;
    }
    send.disabled = true;
    input.disabled = true;
    msg.textContent = 'Sending…';
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ email: email, page: location.pathname, website: form.website.value })
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'failed');
        box.classList.add('done');
        form.style.display = 'none';
        msg.textContent = res.already ? 'You are already on the list. Thank you.' : 'Thank you. A note is on its way to your inbox.';
      })
      .catch(function (err) {
        send.disabled = false;
        input.disabled = false;
        msg.textContent = err.message === 'invalid' ? 'Please check the address.' : 'Something went wrong. Please try again.';
      });
  });

  // On the home page, step aside while the About panel is open, like the title does.
  var modal = document.getElementById('modal');
  if (modal && window.MutationObserver) {
    new MutationObserver(function () {
      box.classList.toggle('hidden', modal.classList.contains('open'));
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
})();
