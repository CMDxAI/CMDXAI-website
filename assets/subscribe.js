// Footer "Subscribe" form ([data-subscribe]); posts to the cmdx-subscribe Cloudflare Worker (worker/).
const ENDPOINT = 'https://cmdx-subscribe.cmdxai.workers.dev';

document.addEventListener('submit', async (e) => {
  const form = e.target.closest('[data-subscribe]');
  if (!form) return;
  e.preventDefault();
  const status = form.querySelector('[role="status"]');
  const button = form.querySelector('button');
  button.disabled = true;
  status.textContent = 'Subscribing…';
  let msg = "We couldn't subscribe you just now. Try again later.";
  try {
    // URLSearchParams keeps this a "simple" CORS request, so there is no preflight.
    const res = await fetch(ENDPOINT, { method: 'POST', body: new URLSearchParams(new FormData(form)) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      form.reset();
      msg = "You're subscribed. Check your inbox for a confirmation.";
    } else if (data.error) {
      msg = data.error;
    }
  } catch {
    // Network error: keep the generic message.
  } finally {
    button.disabled = false;
    status.textContent = msg;
  }
});
