// Features page: five getting-started steps, each with its product clip.
import { createClip, el, tabs } from './clip.js';

const STEPS = [
  { short: 'Deploy', title: 'Deploy CMDX', clip: 'deploy' },
  { short: 'Configure', title: 'Set up your organization', clip: 'org' },
  { short: 'Add users', title: 'Add users and assign roles', clip: 'users' },
  { short: 'Create content', title: 'Create training content with AI', clip: 'ai' },
  { short: 'Assign and track', title: 'Assign training and track progress', clip: 'assign' }
];

const $ = id => document.getElementById(id);
const list = $('step-tabs');
const buttons = STEPS.map((s, k) => {
  const b = el('button', 'step-tab');
  b.type = 'button';
  b.id = 'step-tab-' + k;
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-controls', 'step-panel');
  b.append(el('span', 'n', String(k + 1).padStart(2, '0')), el('span', 't', s.short));
  list.append(b);
  return b;
});
const clip = createClip($('step-clip'));
const mark = tabs(list, select);
let cur = 0;

function select(k) {
  cur = k;
  mark(k);
  $('step-panel').setAttribute('aria-labelledby', buttons[k].id);
  $('step-title').textContent = STEPS[k].title;
  clip.show(STEPS[k].clip);
}
$('step-prev').addEventListener('click', () => select((cur + STEPS.length - 1) % STEPS.length));
$('step-next').addEventListener('click', () => select((cur + 1) % STEPS.length));
select(0);
