// Home page: "Explore the platform" tabs + the clip for the selected module.
import { createClip, el, tabs } from './clip.js';

const FEATURES = [
  { clip: 'training', title: 'Training Management', tag: 'Create, deliver and manage training programs',
    desc: ['Run your whole training program from one place.', 'Create programs, manage courses, assign instructors and schedule sessions, then watch delivery as it happens across departments and teams.'],
    caps: ['Course and training program management', 'Training schedules and assignments', 'Training progress monitoring', 'Completion tracking and reporting'] },
  { clip: 'org', title: 'Organization Management', tag: 'Your organization, your structure',
    desc: ['Mirror your org chart inside the platform.', 'Group employees into departments, teams and business units with reporting lines. Learning is administered centrally, but each department can run its own training.'],
    caps: ['Organization and department configuration', 'Team and business unit management', 'Role-based organizational structures', 'Department-specific learning administration'] },
  { clip: 'assign', title: 'Training Assignment', tag: 'The right training for the right people',
    desc: ['Assign training without spreadsheets.', 'Allocate courses by role, department, designation or an individual development plan, so each person sees training that applies to their job.'],
    caps: ['Individual and group training assignments', 'Role-based training allocation', 'Training enrollment management', 'Assignment and completion tracking'] },
  { clip: 'ai', title: 'AI-Powered Content Generation', tag: 'Draft courses and assessments faster',
    desc: ['Let AI do the first draft.', 'Trainers get help producing course outlines, learning materials and quiz questions, then edit and approve before anything reaches a learner.'],
    caps: ['AI-assisted course content generation', 'Learning material development', 'Assessment question generation', 'Content refinement and enhancement'] },
  { clip: 'assess', title: 'Assessments & Evaluations', tag: 'Measure what learners actually know',
    desc: ['Check understanding with quizzes and structured evaluations.', 'Track scores, see where learners struggle and spot topics that need more training.'],
    caps: ['Online quizzes and assessments', 'Learner performance evaluation', 'Assessment results and reporting', 'Training completion validation'] },
  { clip: 'users', title: 'User Management', tag: 'Every learner in one place',
    desc: ['Keep user administration simple.', 'Manage employees, trainers, managers and administrators with the right permissions, and keep each learner record and training history in one place.'],
    caps: ['User creation and bulk uploads', 'Role and permission management', 'Learner profiles', 'Training history and activity tracking'] },
  { clip: 'blended', title: 'Blended Learning', tag: 'Classroom and online, together',
    desc: ['Mix instructor-led sessions with self-paced content.', 'Classroom training, virtual sessions and online courses sit in one schedule and one record.'],
    caps: ['Instructor-led training', 'Online self-paced courses', 'Hybrid training programs', 'Integrated training schedules'] },
  { clip: 'plans', title: 'Learning Plans', tag: 'Turn courses into a development path',
    desc: ['Sequence courses into a plan that matches a role or a goal.', 'Learners move through the plan step by step and can see what comes next.'],
    caps: ['Structured learning paths', 'Role-based learning plans', 'Progressive training programs', 'Learning milestone tracking'] },
  { clip: 'certs', title: 'Certifications', tag: 'Recognize completed learning',
    desc: ['Issue certificates when learners meet the requirements.', 'Define what each certification needs, track who holds it and keep the records current.'],
    caps: ['Course completion certificates', 'Certification management', 'Employee certification records', 'Certification status tracking'] },
  { clip: 'skills', title: 'Skills & Competency Management', tag: 'Build a skills-driven workforce',
    desc: ['Go beyond completion counts.', 'Define competencies, map skills to roles, find gaps and point people to the training that closes them.'],
    caps: ['Skills and competency frameworks', 'Role-to-skill mapping', 'Skill gap identification', 'Skills-based training recommendations'] }
];

const $ = id => document.getElementById(id);
const list = $('feature-tabs');
const buttons = FEATURES.map((f, k) => {
  const b = el('button', 'feature-tab');
  b.type = 'button';
  b.id = 'feature-tab-' + k;
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-controls', 'feature-panel');
  b.append(el('span', 'feature-tab-n', String(k + 1).padStart(2, '0')), el('span', null, f.title));
  list.append(b);
  return b;
});
const clip = createClip($('feature-clip'));
const mark = tabs(list, select);

function select(k) {
  const f = FEATURES[k];
  mark(k);
  $('feature-panel').setAttribute('aria-labelledby', buttons[k].id);
  $('feature-tag').textContent = f.tag;
  $('feature-desc').replaceChildren(...f.desc.map(d => el('p', null, d)));
  $('feature-caps').replaceChildren(...f.caps.map(c => el('div', 'cap', c)));
  clip.show(f.clip);
}
select(0);
