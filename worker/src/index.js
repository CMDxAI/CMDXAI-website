// Mail endpoint for cmdx.ai's static pages, over SMTP. SMTP details live in Worker secrets, never in this repo.
//   POST /         footer "Subscribe": confirms to the subscriber and tells TEAM_TO.
//   POST /contact  "Get started" dialog: confirms to the sender and sends the message to TEAM_TO.
// ponytail: the team inbox is the subscriber list; add D1 storage once newsletters go out from here.
import { WorkerMailer } from 'worker-mailer';

// One address, no spaces, line breaks or header-breaking characters.
const EMAIL = /^[^\s@<>"(),;:]+@[^\s@<>"(),;:]+\.[^\s@<>"(),;:]+$/;
const FOOTER = ['', 'The CMDX team', 'https://cmdx.ai'];

// Collapse line breaks and runs of space so a value is safe in a subject line.
const oneLine = (v) =>
  String(v ?? '')
    .replace(/\s+/g, ' ')
    .trim();

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

    let messages;
    if (new URL(request.url).pathname === '/contact') {
      const name = oneLine(form.get('name'));
      const organization = oneLine(form.get('organization'));
      const message = String(form.get('message') ?? '').trim();
      if (!name || name.length > 100) return reply(400, 'Enter your name.');
      if (organization.length > 200) return reply(400, 'Shorten the organization name.');
      if (message.length > 5000) return reply(400, 'Shorten your message to 5,000 characters.');
      messages = [
        // The confirmation never repeats what the sender typed, so the form can't relay spam.
        {
          from: { name: 'CMDX', email: env.MAIL_FROM },
          to: email,
          reply: env.REPLY_TO,
          subject: 'Thanks for contacting CMDX',
          text: [
            "Thanks for getting in touch. We've received your message and will reply within two working days.",
            ...FOOTER,
          ].join('\n'),
        },
        {
          from: { name: 'CMDX website', email: env.MAIL_FROM },
          to: env.TEAM_TO.split(','),
          reply: email,
          subject: `Get started: ${name}${organization ? ` (${organization})` : ''}`,
          text: `Name: ${name}\nEmail: ${email}\nOrganization: ${organization || '-'}\n\n${message || '(no message)'}`,
        },
      ];
    } else {
      messages = [
        {
          from: { name: 'CMDX', email: env.MAIL_FROM },
          to: email,
          reply: env.REPLY_TO,
          subject: "You're subscribed to CMDX updates",
          text: [
            'Thanks for subscribing. We will email you product news and releases from CMDX, the open source LMS.',
            '',
            "Didn't sign up, or changed your mind? Reply to this email and we'll remove you.",
            ...FOOTER,
          ].join('\n'),
        },
        {
          from: { name: 'CMDX website', email: env.MAIL_FROM },
          to: env.TEAM_TO.split(','),
          reply: email,
          subject: `New subscriber: ${email}`,
          text: `${email} subscribed to CMDX updates from ${request.headers.get('Referer') ?? 'cmdx.ai'}.`,
        },
      ];
    }

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
        // Confirmation first: a bad sender address then fails before the team gets a notice.
        for (const m of messages) await mailer.send(m);
      } finally {
        // A close on a broken socket must not replace the real send error.
        await mailer.close().catch(() => {});
      }
    } catch (err) {
      console.error('send failed', err);
      return reply(502, "We couldn't send that just now. Try again later.");
    }
    return reply(200);
  },
};
