import { WeekPlan } from '../types';

export const HANDWRITTEN_NOTEBOOK_TASKS = [
  {
    title: 'Finalize - Action Research Diagnostic Test',
    category: 'Research',
    priority: 'High' as const,
    notes: 'Complete test methodology & diagnostic rubrics (Till Oct 3)'
  },
  {
    title: 'Reflective Journal (Re J) -> 1',
    category: 'Study',
    priority: 'High' as const,
    notes: 'Write & submit Reflective Journal entry 1'
  },
  {
    title: 'Activities -> 6',
    category: 'Study',
    priority: 'Medium' as const,
    notes: 'Draft and schedule 6 classroom/interactive activities'
  },
  {
    title: 'Class 6 & 7 -> NCERT',
    category: 'Study',
    priority: 'High' as const,
    notes: 'Cover foundational NCERT textbooks for Class 6 & 7'
  },
  {
    title: 'CDP -> Complete',
    category: 'Exam Prep',
    priority: 'High' as const,
    notes: 'Child Development & Pedagogy core syllabus completion'
  },
  {
    title: 'Hindi -> व्याकरण (3 chapters)',
    category: 'Study',
    priority: 'Medium' as const,
    notes: 'Hindi Grammar chapters 1-3 with exercises'
  },
  {
    title: 'English -> 100 vocab + 50 idioms & phrases',
    category: 'Study',
    priority: 'Medium' as const,
    isRecurring: true,
    notes: 'Weekly recurring target: flashcards & usage drills'
  },
  {
    title: 'Canva -> 7 lessons (1 hour each)',
    category: 'Skills',
    priority: 'Medium' as const,
    notes: 'Digital design skills practice, 1 hour daily'
  },
  {
    title: 'NET -> 2 chapters',
    category: 'Exam Prep',
    priority: 'High' as const,
    notes: 'UGC NET curriculum revision: chapters 1 & 2'
  }
];

export function getSundaySep27Week(): WeekPlan {
  return {
    id: '2026-09-27',
    sundayDate: '2026-09-27',
    title: 'Week of Sunday, Sep 27',
    focusGoal: 'Weekly Plan (Till 3 October) - Action Research, NCERT 6 & 7, CDP and NET prep',
    createdAt: '2026-09-26T14:00:00.000Z',
    tasks: [
      {
        id: 'task-0927-1',
        title: 'Finalize - Action Research Diagnostic Test',
        category: 'Research',
        priority: 'High',
        completed: false,
        createdAt: '2026-09-26T14:05:00.000Z',
        notes: 'Complete test methodology & diagnostic rubrics (Till Oct 3)'
      },
      {
        id: 'task-0927-2',
        title: 'Reflective Journal (Re J) -> 1',
        category: 'Study',
        priority: 'High',
        completed: false,
        createdAt: '2026-09-26T14:06:00.000Z',
        notes: 'Write & submit Reflective Journal entry 1'
      },
      {
        id: 'task-0927-3',
        title: 'Activities -> 6',
        category: 'Study',
        priority: 'Medium',
        completed: false,
        createdAt: '2026-09-26T14:07:00.000Z',
        notes: 'Draft and schedule 6 classroom/interactive activities'
      },
      {
        id: 'task-0927-4',
        title: 'Class 6 & 7 -> NCERT',
        category: 'Study',
        priority: 'High',
        completed: false,
        createdAt: '2026-09-26T14:08:00.000Z',
        notes: 'Cover foundational NCERT textbooks for Class 6 & 7'
      },
      {
        id: 'task-0927-5',
        title: 'CDP -> Complete',
        category: 'Exam Prep',
        priority: 'High',
        completed: false,
        createdAt: '2026-09-26T14:09:00.000Z',
        notes: 'Child Development & Pedagogy core syllabus completion'
      },
      {
        id: 'task-0927-6',
        title: 'Hindi -> व्याकरण (3 chapters)',
        category: 'Study',
        priority: 'Medium',
        completed: false,
        createdAt: '2026-09-26T14:10:00.000Z',
        notes: 'Hindi Grammar chapters 1-3 with exercises'
      },
      {
        id: 'task-0927-7',
        title: 'English -> 100 vocab + 50 idioms & phrases (every week)',
        category: 'Study',
        priority: 'Medium',
        isRecurring: true,
        completed: false,
        createdAt: '2026-09-26T14:11:00.000Z',
        notes: 'Weekly recurring target: flashcards & usage drills'
      },
      {
        id: 'task-0927-8',
        title: 'Canva -> 7 lessons (1 hour each)',
        category: 'Skills',
        priority: 'Medium',
        completed: false,
        createdAt: '2026-09-26T14:12:00.000Z',
        notes: 'Digital design skills practice, 1 hour daily'
      },
      {
        id: 'task-0927-9',
        title: 'NET -> 2 chapters',
        category: 'Exam Prep',
        priority: 'High',
        completed: false,
        createdAt: '2026-09-26T14:13:00.000Z',
        notes: 'UGC NET curriculum revision: chapters 1 & 2'
      }
    ]
  };
}

export function getInitialDemoData(): WeekPlan[] {
  return [getSundaySep27Week()];
}

