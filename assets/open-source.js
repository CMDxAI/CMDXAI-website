// Open Source page: quick start for deployers and developers.
import { el, tabs } from './clip.js';

const TRACKS = [
  { label: 'For deployment', primary: ['/download', 'Download'], secondary: ['https://github.com/CMDxAI/cmdx-LMS/blob/main/SETUP_GUIDE.md', 'Full setup guide'], steps: [
    { title: 'Start the backend', code: 'cd backend\npython -m venv .venv\nsource .venv/bin/activate\npip install -r requirements.txt\n\nuvicorn main:app --reload' },
    { title: 'Start the frontend', code: 'cd frontend\nnpm install\nnpm run web' },
    { title: 'Create an empty database', code: 'CREATE DATABASE lms;' },
    { title: 'Walk through the wizard', code: 'open http://localhost:8081/install', items: ['1 · Prepare', '2 · Prechecks', '3 · Database', '4 · Services', '5 · Site & admin', '6 · Install'] }
  ] },
  { label: 'For developers', primary: ['https://github.com/CMDxAI/cmdx-LMS/blob/main/CONTRIBUTING.md', 'Read CONTRIBUTING.md'], secondary: ['https://github.com/CMDxAI/cmdx-LMS/issues', 'Browse open issues'], steps: [
    { title: 'Fork and branch', code: 'git clone https://github.com/<your-user>/cmdx-LMS.git\ncd cmdx-LMS\ngit checkout -b my-change main' },
    { title: 'Set up the backend', code: 'cd backend\npython -m venv venv\nsource venv/bin/activate\npip install -r requirements-dev.txt\n\npytest\nblack . && isort . && flake8' },
    { title: 'Set up the frontend', code: 'cd frontend\nnpm install\nnpm run dev\n\nnpm test\nnpm run lint:fix && npm run format' },
    { title: 'Open a pull request', code: 'Add user authentication endpoint\n\n- Implement JWT token generation\n- Add login/logout endpoints\n- Add password reset functionality\n\nCloses #123', items: ['Add tests for new code', 'Update docs for changed APIs', 'Test suite passes', 'Code lints', 'Present tense, imperative mood', 'First line under 72 characters'] }
  ] }
];

const $ = id => document.getElementById(id);

const trackList = $('qs-tracks'), stepList = $('qs-steps');
trackList.append(...TRACKS.map(t => {
  const b = el('button', 'track', t.label);
  b.type = 'button';
  b.setAttribute('role', 'tab');
  return b;
}));
const markTrack = tabs(trackList, selectTrack);
const markStep = tabs(stepList, selectStep);
let track;

function selectTrack(k) {
  track = TRACKS[k];
  markTrack(k);
  [['qs-primary', track.primary], ['qs-secondary', track.secondary]].forEach(([id, [href, label]]) => { $(id).href = href; $(id).textContent = label; });
  stepList.replaceChildren(...track.steps.map((s, i) => {
    const b = el('button', 'step-tab');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.append(el('span', 'n', String(i + 1).padStart(2, '0')), el('span', 't', s.title));
    return b;
  }));
  selectStep(0);
}

function selectStep(i) {
  const s = track.steps[i];
  markStep(i);
  $('qs-code').textContent = s.code;
  $('qs-items').replaceChildren(...(s.items || []).map(c => el('span', null, c)));
}

selectTrack(0);
