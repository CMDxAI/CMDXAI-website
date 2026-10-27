// "Get started" contact dialog, opened by any [data-contact] link (its mailto href is the no-JS fallback).
// Send posts to the Worker's /contact route (worker/), which emails the team and confirms to the sender.
import { ENDPOINT } from './subscribe.js';

const TO = 'hello@cmdx.ai';
let dlg;

function build() {
  dlg = document.createElement('dialog');
  dlg.className = 'contact';
  dlg.setAttribute('aria-labelledby', 'contact-title');
  dlg.innerHTML = `
    <div class="contact-body">
      <div class="contact-head">
        <div class="stack" style="gap:8px">
          <div class="eyebrow">Get started</div>
          <h2 id="contact-title">Tell us about your organization</h2>
        </div>
        <button type="button" class="contact-x" data-close aria-label="Close">×</button>
      </div>
      <form>
        <div class="contact-row">
          <label><span>Name</span><input name="name" type="text" required autocomplete="name" autofocus></label>
          <label><span>Work email</span><input name="email" type="email" required autocomplete="email"></label>
        </div>
        <label><span>Organization</span><input name="organization" type="text" autocomplete="organization"></label>
        <label><span>How can we help?</span><textarea name="message" rows="4" maxlength="5000"></textarea></label>
        <input name="hp" class="subscribe-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <p class="contact-err" role="alert"></p>
        <div class="contact-foot">
          <span>We reply within two working days.</span>
          <button type="submit" class="btn btn-primary" style="padding:0 24px;font-size:16px">Send</button>
        </div>
      </form>
      <div class="contact-done">
        <div class="contact-tick"><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" style="display:block"><path d="M9.55 17.65 4.6 12.7l1.4-1.4 3.55 3.55 8.45-8.45 1.4 1.4Z" fill="currentColor"/></svg></div>
        <p>Thanks. We've got your message and will be in touch within two working days.</p>
        <p class="muted" style="font-size:15px">We've sent a confirmation to your inbox.</p>
        <div><button type="button" class="btn btn-soft" data-close style="padding:0 24px;font-size:16px">Close</button></div>
      </div>
    </div>`;
  document.body.append(dlg);
  // Clicks on the dialog box itself (not its content) are backdrop clicks. A click whose press
  // started inside the content (e.g. a text selection dragged outside) also targets the dialog,
  // so the press must start on the backdrop too.
  let pressedBackdrop = false;
  dlg.addEventListener('pointerdown', (e) => { pressedBackdrop = e.target === dlg; });
  dlg.addEventListener('click', (e) => {
    if ((e.target === dlg && pressedBackdrop) || e.target.closest('[data-close]')) dlg.close();
  });
  const form = dlg.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = form.querySelector('.contact-err');
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    err.textContent = '';
    let msg = `We couldn't send that just now. Try again, or email us at ${TO}.`;
    try {
      // URLSearchParams keeps this a "simple" CORS request, so there is no preflight.
      const res = await fetch(`${ENDPOINT}/contact`, { method: 'POST', body: new URLSearchParams(new FormData(form)) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        dlg.classList.add('sent');
        return;
      }
      if (data.error) msg = data.error;
    } catch {
      // Network error: keep the generic message.
    } finally {
      button.disabled = false;
    }
    err.textContent = msg;
  });
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-contact]')) return;
  e.preventDefault();
  if (!dlg) build();
  dlg.classList.remove('sent');
  dlg.querySelector('form').reset();
  dlg.querySelector('.contact-err').textContent = '';
  dlg.showModal();
});
