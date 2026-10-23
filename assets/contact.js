// "Get started" contact dialog, opened by any [data-contact] link (its mailto href is the no-JS fallback).
// ponytail: no backend on GitHub Pages, so Send hands the message to the visitor's mail app;
// swap the submit handler for a fetch() to a form service if messages must arrive without it.
const TO = 'hello@cmdx.ai';
const MAX_MAILTO = 2000;
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
        <label><span>How can we help?</span><textarea name="message" rows="4"></textarea></label>
        <div class="contact-foot">
          <span>We reply within two working days.</span>
          <button type="submit" class="btn btn-primary" style="padding:0 24px;font-size:16px">Send</button>
        </div>
      </form>
      <div class="contact-done">
        <div class="contact-tick"><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" style="display:block"><path d="M9.55 17.65 4.6 12.7l1.4-1.4 3.55 3.55 8.45-8.45 1.4 1.4Z" fill="currentColor"/></svg></div>
        <p>Thanks. Your email app should open with your message ready to send. Once it's sent, we'll be in touch within two working days.</p>
        <p class="muted" style="font-size:15px">Nothing opened? Email us at <a href="mailto:${TO}">${TO}</a>.</p>
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
  const msg = form.elements.message;
  msg.addEventListener('input', () => msg.setCustomValidity(''));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const body = `Name: ${f.get('name')}\nEmail: ${f.get('email')}\nOrganization: ${f.get('organization')}\n\n${f.get('message')}`;
    const url = `mailto:${TO}?subject=${encodeURIComponent('Getting started with CMDX')}&body=${encodeURIComponent(body)}`;
    // ponytail: ~2000 chars is the smallest common mailto limit (Outlook on Windows); past it the
    // mail app may not open, so ask for a shorter message instead of showing "sent".
    if (url.length > MAX_MAILTO) {
      msg.setCustomValidity(`This message is too long to pass to your email app. Shorten it, or email ${TO} directly.`);
      msg.reportValidity();
      return;
    }
    location.href = url;
    dlg.classList.add('sent');
  });
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-contact]')) return;
  e.preventDefault();
  if (!dlg) build();
  dlg.classList.remove('sent');
  dlg.querySelector('form').reset();
  dlg.querySelector('textarea').setCustomValidity('');
  dlg.showModal();
});
