// Click-through product clips: frames are 1180×1022 captures of the admin app.
// target = cursor click point as 0–1 coords in the 4:3 box; null = cut without a click.
const s = (src, caption, x, y) => ({ src: 'assets/clips/' + src + '.png', caption, target: x == null ? null : { x, y } });

export const CLIPS = {
  training: { title: 'Training Management', steps: [s('v3/training-1', 'Open Training Sessions', 0.1297, 0.4802), s('v3/training-2', 'Review a training’s overview', 0.1364, 0.1571), s('v3/training-3', 'Check scheduled sessions', 0.378, 0.0927), s('v3/training-4', 'Track attendance', 0.4644, 0.0927), s('v3/training-5', 'Set completion criteria')] },
  org: { title: 'Organization Management', steps: [s('v3/org-1', 'Open Settings'), s('v3/org-2', 'View the organization', 0.1644, 0.1186), s('v3/org-3', 'Manage departments', 0.2492, 0.1186), s('v3/org-4', 'Review members and roles', 0.311, 0.1186), s('v3/org-5', 'Configure single sign-on')] },
  assign: { title: 'Training Assignment', steps: [s('v3/assign-1', 'Open enrollments', 0.9127, 0.0497), s('v3/assign-2', 'Enroll learners'), s('v3/assign-3', 'Review enrollment rules', 0.928, 0.0881), s('v3/assign-4', 'Create a rule by role or department'), s('v3/assign-5', 'Assign by group')] },
  ai: { title: 'AI-Powered Content Generation', steps: [s('v3/ai-1', 'Open the Course Generator', 0.911, 0.0497), s('v3/ai-2', 'Upload source material'), s('v3/ai-3', 'Write the course brief'), s('v3/ai-4', 'Review the generated outline'), s('v3/ai-5', 'Edit generated lessons'), s('v3/ai-6', 'Publish as a course')] },
  assess: { title: 'Assessments & Evaluations', steps: [s('v3/assess-1', 'Open a quiz', 0.9305, 0.0881), s('v3/assess-2', 'Set attempts, time limit and passing score', 0.1407, 0.1571), s('v3/assess-3', 'Build questions', 0.2254, 0.1966), s('v3/assess-4', 'Review submissions', 0.3042, 0.1571), s('v3/assess-5', 'Grade pending attempts')] },
  users: { title: 'User Management', steps: [s('v3/users-1', 'Open User Management', 0.1322, 0.5085), s('v3/users-2', 'View a learner’s profile and history', 0.8839, 0.1333), s('v3/users-3', 'Add a user'), s('v3/users-4', 'Bulk import from CSV'), s('v3/users-5', 'Manage roles and permissions')] },
  blended: { title: 'Blended Learning', steps: [s('v3/blended-1', 'Open Course Management', 0.1288, 0.4316), s('v3/blended-2', 'Open a course', 0.1356, 0.3356), s('v3/blended-3', 'Mix videos, quizzes and trainings in the builder'), s('v3/blended-4', 'Add an instructor-led training item'), s('v3/blended-5', 'See every session in one calendar')] },
  plans: { title: 'Learning Plans', steps: [s('v3/plans-1', 'Open a course', 0.1356, 0.3356), s('v3/plans-2', 'Sequence the content', 0.1297, 0.3107), s('v3/plans-3', 'Set prerequisites and completion'), s('v3/plans-4', 'See where each learner is', 0.4415, 0.1571), s('v3/plans-5', 'Track progress along the plan')] },
  certs: { title: 'Certifications', steps: [s('v3/certs-1', 'Certificates issued per course'), s('v3/certs-2', 'Certificates on a learner’s record'), s('v3/certs-3', 'Certificate-issued notification template', 0.2246, 0.0542), s('v3/certs-4', 'Delivery log for certificate emails'), s('v3/certs-5', 'Completion and certification reports')] },
  skills: { title: 'Skills & Competency Management', steps: [s('v3/skills-1', 'Open Reports', 0.411, 0.1186), s('v3/skills-2', 'Assessment scores by topic', 0.2915, 0.1186), s('v3/skills-3', 'Completion rate by course', 0.5136, 0.1186), s('v3/skills-4', 'Pass and fail by competency', 0.6068, 0.1186), s('v3/skills-5', 'Learner activity and gaps')] },
  deploy: { title: 'Deploy CMDX', steps: [s('v2/deploy-1', 'Before you begin', 0.127, 0.1921), s('v2/deploy-2', 'Run the environment prechecks', 0.127, 0.2554), s('v2/deploy-3', 'Connect the database', 0.127, 0.3186), s('v2/deploy-4', 'Choose storage and services', 0.127, 0.3864), s('v2/deploy-5', 'Name the site and create the admin', 0.127, 0.4497), s('v2/deploy-6', 'Review the install summary'), s('v2/deploy-7', 'Run the install'), s('v2/deploy-8', 'Installed and sealed')] }
};

const STEP_MS = 1200;
const pad = n => String(n).padStart(2, '0');

export const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

// Builds the clip player inside root; call show(id) to swap clips.
export function createClip(root) {
  root.classList.add('clip');
  root.innerHTML = `
    <div class="clip-box">
      <div class="clip-frames"></div>
      <div class="clip-cursor" aria-hidden="true" hidden>
        <span class="clip-pulse"></span>
        <svg width="22" height="26" viewBox="0 0 22 26"><path d="M3 2 L3 20.5 L7.6 16.4 L10.6 23.4 L13.6 22.1 L10.7 15.3 L17 15.3 Z" fill="#fff" stroke="#181818" stroke-width="1.4" stroke-linejoin="round"/></svg>
      </div>
      <button type="button" class="clip-toggle">
        <svg class="i-pause" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
        <svg class="i-play" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>
      </button>
    </div>
    <div class="clip-bar">
      <div class="clip-label" aria-live="polite"><span class="num"></span><span class="clip-caption"></span></div>
      <div class="clip-dots" role="tablist" aria-label="Clip steps"></div>
    </div>`;
  const q = sel => root.querySelector(sel);
  const frames = q('.clip-frames'), cursor = q('.clip-cursor'), toggle = q('.clip-toggle'), dots = q('.clip-dots');
  const st = { clip: null, step: 0, playing: !matchMedia('(prefers-reduced-motion: reduce)').matches, timers: [] };

  const clear = () => { st.timers.forEach(clearTimeout); st.timers = []; };

  function render() {
    const steps = st.clip.steps, i = st.step;
    [...frames.children].forEach((img, k) => {
      img.classList.toggle('on', k === i);
      img.alt = k === i ? st.clip.title + ' — ' + steps[k].caption : '';
    });
    [...dots.children].forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
    q('.clip-label .num').textContent = pad(i + 1) + ' / ' + pad(steps.length);
    q('.clip-caption').textContent = steps[i].caption;
  }

  // Move cursor to the step's click target, pulse a click, then advance.
  function go(i) {
    clear();
    st.step = i;
    const step = st.clip.steps[i];
    cursor.classList.remove('clicking');
    render();
    st.timers.push(setTimeout(() => {
      if (!step.target) return;
      cursor.hidden = false;
      cursor.style.left = step.target.x * 100 + '%';
      cursor.style.top = step.target.y * 100 + '%';
    }, 60));
    if (!st.playing) return;
    if (step.target) st.timers.push(setTimeout(() => cursor.classList.add('clicking'), STEP_MS * 0.62));
    st.timers.push(setTimeout(() => go((i + 1) % st.clip.steps.length), STEP_MS));
  }

  function setPlaying(p) {
    st.playing = p;
    toggle.setAttribute('aria-label', p ? 'Pause clip' : 'Play clip');
    toggle.classList.toggle('paused', !p);
    if (st.clip) go(st.step);
  }
  toggle.addEventListener('click', () => setPlaying(!st.playing));
  setPlaying(st.playing);

  return {
    show(id) {
      st.clip = CLIPS[id] || CLIPS.training;
      frames.replaceChildren(...st.clip.steps.map(step => {
        const img = el('img', 'clip-frame');
        img.src = step.src; img.width = 1180; img.height = 1022; img.draggable = false; img.alt = '';
        return img;
      }));
      dots.replaceChildren(...st.clip.steps.map((step, k) => {
        const b = el('button', 'clip-dot');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Step ' + (k + 1) + ': ' + step.caption);
        b.append(el('span'));
        b.addEventListener('click', () => go(k));
        return b;
      }));
      cursor.hidden = true;
      go(0);
    }
  };
}

// Tab list behaviour via delegation (children may be swapped): click + arrow keys call select(k).
// Returns mark(k), which updates aria-selected / tabindex / .done on the current children.
export function tabs(list, select) {
  const btns = () => [...list.children];
  list.addEventListener('click', e => {
    const b = e.target.closest('[role="tab"]');
    if (b && b.parentElement === list) select(btns().indexOf(b));
  });
  list.addEventListener('keydown', e => {
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    const all = btns(), cur = all.findIndex(b => b.getAttribute('aria-selected') === 'true');
    if (!d || cur < 0) return;
    e.preventDefault();
    const k = (cur + d + all.length) % all.length;
    select(k);
    btns()[k].focus();
  });
  return k => btns().forEach((b, i) => {
    b.setAttribute('aria-selected', String(i === k));
    b.classList.toggle('done', i < k);
    b.tabIndex = i === k ? 0 : -1;
  });
}
