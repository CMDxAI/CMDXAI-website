// Footer "Subscribe" endpoint for cmdx.ai: tells the team about each new subscriber over SMTP
// and sends the subscriber a confirmation. SMTP details live in Worker secrets, never in this repo.
// ponytail: the team inbox is the subscriber list; add D1 storage once newsletters go out from here.
import { WorkerMailer } from 'worker-mailer';

// One address, no spaces, line breaks or header-breaking characters.
const EMAIL = /^[^\s@<>"(),;:]+@[^\s@<>"(),;:]+\.[^\s@<>"(),;:]+$/;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = env.ALLOWED_ORIGINS.split(',').includes(origin);
    const reply = (status, error) =>
      Response.json(error ? { error } : { ok: true }, {
        status,
        headers: allowed ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {},
      });

    if (request.method !== 'POST') return reply(405, 'Method not allowed.');
    // ponytail: Origin stops other sites' pages, not scripts; the per-IP limit covers those.
    if (!allowed) return reply(403, 'Forbidden.');
    const ip = request.headers.get('CF-Connecting-IP') ?? '';
    if (!(await env.LIMITER.limit({ key: ip })).success) {
      return reply(429, 'Too many attempts. Try again in a minute.');
    }

    const form = await request.formData().catch(() => null);
    // Honeypot: the off-screen "hp" field is only ever filled by bots, so pretend it worked.
    // Its name must not look like anything browser autofill knows (company, url, phone...).
    if (form?.get('hp')) return reply(200);
    const email = String(form?.get('email') ?? '').trim();
    if (email.length > 254 || !EMAIL.test(email)) return reply(400, 'Enter a valid email address.');
    // ponytail: caps how often one inbox can be emailed, not the daily total; add Turnstile if abused.
    if (!(await env.RECIPIENT_LIMITER.limit({ key: email.toLowerCase() })).success) {
      return reply(429, 'Too many attempts. Try again in a minute.');
    }

    const port = Number(env.SMTP_PORT);
    try {
      const mailer = await WorkerMailer.connect({
        host: env.SMTP_HOST,
        port,
        secure: port === 465, // 465 is TLS from the start; 587 upgrades with STARTTLS
        credentials: { username: env.SMTP_USER, password: env.SMTP_PASS },
        authType: ['plain', 'login'],
      });
      try {
        // Confirm first: a bad subscriber address then fails before the team gets a notice.
        await mailer.send({
          from: { name: 'CMDX', email: env.MAIL_FROM },
          to: email,
          reply: env.NOTIFY_TO,
          subject: "You're subscribed to CMDX updates",
          text: [
            'Thanks for subscribing. We will email you product news and releases from CMDX, the open source LMS.',
            '',
            "Didn't sign up, or changed your mind? Reply to this email and we'll remove you.",
            '',
            'The CMDX team',
            'https://cmdx.ai',
          ].join('\n'),
        });
        await mailer.send({
          from: { name: 'CMDX website', email: env.MAIL_FROM },
          to: env.NOTIFY_TO,
          reply: email,
          subject: `New subscriber: ${email}`,
          text: `${email} subscribed to CMDX updates from ${request.headers.get('Referer') ?? 'cmdx.ai'}.`,
        });
      } finally {
        // A close on a broken socket must not replace the real send error.
        await mailer.close().catch(() => {});
      }
    } catch (err) {
      console.error('subscribe failed', err);
      return reply(502, "We couldn't subscribe you just now. Try again later.");
    }
    return reply(200);
  },
};
