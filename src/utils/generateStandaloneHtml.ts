/**
 * Generates a complete, self-contained single-file HTML code block
 * with embedded Tailwind CSS, Lucide icons, Chart.js, Canvas-Confetti,
 * and persistent localStorage logic.
 */

export function generateStandaloneHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Weekly Plan - Task & Progress Tracker</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="description" content="A responsive weekly task planner and analytics dashboard organized by Sunday cycles." />
  <!-- Google Fonts: Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- Canvas-Confetti CDN -->
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>
  <!-- Lucide Icons CDN -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    button, input:not([type="checkbox"]), select { min-height: 44px; }
    :focus-visible { outline: 3px solid #4f46e5 !important; outline-offset: 3px; }
    .dark :focus-visible { outline-color: #a5b4fc !important; }
    main, dialog { overflow-wrap: anywhere; }
    dialog { color: inherit; margin: auto; padding: 0; border: 0; max-width: calc(100vw - 32px); max-height: calc(100dvh - 32px); overflow-y: auto; }
    dialog::backdrop { background: rgb(0 0 0 / .5); }
    .text-neutral-400 { color: #666 !important; }
    .dark .text-neutral-400, .dark .dark\\:text-neutral-500 { color: #b3b3b3 !important; }
    .text-emerald-600 { color: #087953 !important; }
    .dark .text-emerald-600 { color: #6ee7b7 !important; }
    .bg-emerald-600 { background: #087953 !important; }
    .dark .dark\\:bg-emerald-500 { background: #087953 !important; }
    .text-rose-500, .text-rose-600 { color: #be123c !important; }
    .text-amber-600 { color: #925b08 !important; }
    dialog input, dialog select { color: #182235 !important; }
    .dark dialog input, .dark dialog select { color: #ecf0f8 !important; }
    .dark .text-rose-500, .dark .text-rose-600 { color: #fb7185 !important; }
    .dark .text-amber-600 { color: #fbbf24 !important; }
    .dark .text-blue-600 { color: #93c5fd !important; }
    @media (max-width: 820px) { input, select { font-size: 16px !important; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }

    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .tabular-nums { font-variant-numeric: tabular-nums; }
  </style>
</head>
<body class="bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 min-h-screen transition-colors duration-200">
  
  <!-- Navigation Bar -->
  <header class="sticky top-0 z-30 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-center justify-between gap-3 py-3">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            WP
          </div>
          <span class="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">WeeklyPlan</span>
        </div>

        <nav aria-label="Planner views" class="flex flex-wrap items-center gap-3">
          <button id="nav-current-btn" onclick="switchView('current')" class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <i aria-hidden="true" data-lucide="check-square" class="w-4 h-4"></i>
            <span>Current Week</span>
          </button>
          <button id="nav-history-btn" onclick="switchView('history')" class="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5">
            <i aria-hidden="true" data-lucide="bar-chart-3" class="w-4 h-4"></i>
            <span>Progress Board</span>
          </button>
          <button onclick="openNotebookModal()" class="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5">
            <i aria-hidden="true" data-lucide="book-open" class="w-4 h-4 text-emerald-500"></i>
            <span>Handwritten Plan</span>
          </button>
        </nav>

        <div class="flex items-center gap-2 sm:gap-3">
          <button onclick="openNewWeekModal()" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">
            <i aria-hidden="true" data-lucide="plus" class="w-4 h-4"></i>
            <span>Start New Weekly Plan</span>
          </button>
          <button aria-label="Toggle light or dark theme" onclick="toggleTheme()" class="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
            <i id="theme-icon" data-lucide="moon" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- View 1: Current Week -->
    <div id="view-current" class="space-y-8">
      
      <!-- Week Banner / Sunday Notice -->
      <div id="sunday-alert-banner" class="hidden p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <i aria-hidden="true" data-lucide="sparkles" class="w-5 h-5 text-emerald-600 dark:text-emerald-400"></i>
          <p class="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            <strong>Today is Sunday!</strong> Time to review last week and launch your new weekly cycle.
          </p>
        </div>
        <button onclick="openNewWeekModal()" class="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
          Launch Weekly Plan
        </button>
      </div>

      <!-- Header & Week Switcher -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            <span id="current-week-range">Sep 27 – Oct 3, 2026</span>
            <span>·</span>
            <span>7-Day Cycle</span>
          </div>
          <h1 id="current-week-title" class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Week of Sunday, Sep 27
          </h1>
          <p id="current-week-goal" class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Focus: Weekly Plan (Till 3 October) - Action Research, NCERT 6 & 7, CDP and NET prep
          </p>
        </div>

        <div class="flex items-center gap-3">
          <select aria-label="Select week" id="week-selector" onchange="onSelectWeek(this.value)" class="text-xs sm:text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
            <!-- Populated via JS -->
          </select>
          <button onclick="openTaskModal()" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg shadow-sm">
            <i aria-hidden="true" data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Add Task</span>
          </button>
        </div>
      </div>

      <!-- Current Week Progress Dashboard -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Circular Gauge Card -->
        <div class="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-around">
          <div class="relative w-28 h-28 flex items-center justify-center">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="currentColor" stroke-width="8" class="text-neutral-100 dark:text-neutral-800" fill="transparent"></circle>
              <circle id="gauge-circle" cx="50" cy="50" r="42" stroke="currentColor" stroke-width="8" stroke-dasharray="264" stroke-dashoffset="176" stroke-linecap="round" class="text-emerald-500 transition-all duration-700" fill="transparent"></circle>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span id="gauge-percent" class="text-2xl font-bold tabular-nums">33%</span>
              <span class="text-[10px] uppercase font-semibold text-neutral-400">Done</span>
            </div>
          </div>
          <div>
            <span id="status-badge" class="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
              In Progress
            </span>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Week Status</p>
          </div>
        </div>

        <!-- Metric Counter Card -->
        <div class="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Task Completion
          </span>
          <div class="my-2">
            <div class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white tabular-nums">
              <span id="stat-completed">3</span> <span class="text-neutral-400 font-normal text-xl">/ <span id="stat-total">9</span></span>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              <strong id="stat-remaining" class="text-neutral-800 dark:text-neutral-200">6</strong> tasks remaining this cycle
            </p>
          </div>
          <div class="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div id="stat-progress-bar" class="bg-emerald-500 h-full rounded-full transition-all duration-500" style="width: 33%"></div>
          </div>
        </div>

        <!-- Priority Breakdown Card -->
        <div class="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Priority Breakdown
          </span>
          <div class="grid grid-cols-3 gap-2 my-2 text-center">
            <div class="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30">
              <span class="text-xs font-medium text-rose-600 dark:text-rose-400 block">High</span>
              <span id="priority-high-count" class="text-lg font-bold text-rose-700 dark:text-rose-300 tabular-nums">5</span>
            </div>
            <div class="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30">
              <span class="text-xs font-medium text-amber-600 dark:text-amber-400 block">Medium</span>
              <span id="priority-med-count" class="text-lg font-bold text-amber-700 dark:text-amber-300 tabular-nums">4</span>
            </div>
            <div class="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30">
              <span class="text-xs font-medium text-blue-600 dark:text-blue-400 block">Low</span>
              <span id="priority-low-count" class="text-lg font-bold text-blue-700 dark:text-blue-300 tabular-nums">0</span>
            </div>
          </div>
          <div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Weekly Target: Complete All</span>
            <button onclick="triggerConfettiCelebration()" class="hover:underline text-emerald-600 dark:text-emerald-400">Test 🎉</button>
          </div>
        </div>

      </div>

      <!-- Task Controls & Filters -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <!-- Filter Tabs -->
        <div class="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-fit">
          <button onclick="setFilter('all')" id="filter-all" class="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs">
            All Tasks (<span id="count-all">9</span>)
          </button>
          <button onclick="setFilter('remaining')" id="filter-remaining" class="px-3.5 py-1.5 text-xs font-medium rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
            Remaining (<span id="count-remaining">6</span>)
          </button>
          <button onclick="setFilter('completed')" id="filter-completed" class="px-3.5 py-1.5 text-xs font-medium rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
            Completed (<span id="count-completed">3</span>)
          </button>
        </div>

        <!-- Quick Search -->
        <div class="relative w-full sm:w-64">
          <i aria-hidden="true" data-lucide="search" class="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
          <input
            aria-label="Search tasks" id="task-search-input"
            type="text"
            oninput="renderTasks()"
            placeholder="Search tasks..."
            class="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <!-- Task List Container -->
      <div id="task-list" class="space-y-2">
        <!-- Rendered via JS -->
      </div>

    </div>

    <!-- View 2: Progress Board (Multi-Week Analytics & History) -->
    <div id="view-history" class="hidden space-y-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Multi-Week Progress Board
        </h1>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Historical completion trends, weekly summary cards, and past task archives
        </p>
      </div>

      <!-- Chart.js Canvas Container -->
      <div class="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-neutral-900 dark:text-white">
            Weekly Completion Percentage (%)
          </h2>
          <span class="text-xs text-neutral-500 dark:text-neutral-400">Week-over-week performance</span>
        </div>
        <div class="h-64 sm:h-80 w-full relative">
          <canvas role="img" aria-label="Weekly completion percentages. Exact values appear in the week cards below." id="progressChart"></canvas>
        </div>
      </div>

      <!-- Weekly Summary Cards Grid -->
      <div>
        <h2 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">
          All Sunday Week Plans
        </h2>
        <div id="weeks-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Rendered via JS -->
        </div>
      </div>
    </div>

  </main>

  <!-- New Week Modal -->
  <dialog id="new-week-modal" aria-labelledby="new-week-modal-title" class="bg-transparent w-full max-w-lg">
    <div class="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <h2 id="new-week-modal-title" class="text-base font-semibold text-neutral-900 dark:text-white">Start New Weekly Plan</h2>
        <button aria-label="Close dialog" onclick="closeNewWeekModal()" class="text-neutral-400 hover:text-neutral-600"><i aria-hidden="true" data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form onsubmit="handleCreateNewWeek(event)" class="space-y-4">
        <div>
          <label for="new-week-date" class="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Sunday Start Date</label>
          <input id="new-week-date" type="date" required class="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        </div>
        <div>
          <label for="new-week-goal" class="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Weekly Focus Goal</label>
          <input id="new-week-goal" type="text" placeholder="e.g. Master NCERT Class 7 & complete 2 chapters" class="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        </div>
        <div class="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <label class="flex items-center gap-2 cursor-pointer">
            <input id="new-week-carryover" type="checkbox" checked class="w-4 h-4 text-emerald-600 rounded">
            <span class="text-xs font-medium text-neutral-800 dark:text-neutral-200">Carry over unfinished tasks from latest week</span>
          </label>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <button type="button" onclick="closeNewWeekModal()" class="px-4 py-2 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">Cancel</button>
          <button type="submit" class="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Create Plan</button>
        </div>
      </form>
    </div>
  </dialog>

  <!-- Task Modal (Add/Edit) -->
  <dialog id="task-modal" aria-labelledby="task-modal-title" class="bg-transparent w-full max-w-lg">
    <div class="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <h2 id="task-modal-title" class="text-base font-semibold text-neutral-900 dark:text-white">Add New Task</h2>
        <button aria-label="Close dialog" onclick="closeTaskModal()" class="text-neutral-400 hover:text-neutral-600"><i aria-hidden="true" data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form onsubmit="handleSaveTask(event)" class="space-y-4">
        <input type="hidden" id="task-edit-id" value="">
        <div>
          <label for="task-title-input" class="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Task Title *</label>
          <input id="task-title-input" type="text" required placeholder="e.g. Hindi Grammar 3 chapters" class="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="task-category-input" class="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Category</label>
          <select id="task-category-input" class="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800">
              <option value="Study">Study</option>
              <option value="Exam Prep">Exam Prep</option>
              <option value="Research">Research</option>
              <option value="Skills">Skills</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
          <div>
            <label for="task-priority-input" class="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Priority</label>
          <select id="task-priority-input" class="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800">
              <option value="High">High</option>
              <option value="Medium" selected>Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
        <div>
          <label for="task-notes-input" class="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Notes / Target</label>
          <input id="task-notes-input" type="text" placeholder="e.g. 1 hour daily" class="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <button type="button" onclick="closeTaskModal()" class="px-4 py-2 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">Cancel</button>
          <button type="submit" class="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Save Task</button>
        </div>
      </form>
    </div>
  </dialog>

  <!-- Notebook Modal -->
  <dialog id="notebook-modal" aria-labelledby="notebook-modal-title" class="bg-transparent w-full max-w-lg">
    <div class="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <h2 id="notebook-modal-title" class="text-base font-semibold text-neutral-900 dark:text-white">Handwritten Notebook Transcription</h2>
        <button aria-label="Close dialog" onclick="closeNotebookModal()" class="text-neutral-400 hover:text-neutral-600"><i aria-hidden="true" data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <p class="text-xs text-neutral-600 dark:text-neutral-400">
        Source: <em>Sunday's Tasks (1st Week -> Till 3 October)</em>
      </p>
      <div class="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-xs space-y-1.5 font-mono">
        <div>• Finalize - Action Research Diagnostic Test (Research / High)</div>
        <div>• Reflective Journal (Re J) -> 1 (Study / High)</div>
        <div>• Activities -> 6 (Study / Med)</div>
        <div>• Class 6 & 7 -> NCERT (Study / High)</div>
        <div>• CDP -> Complete (Exam Prep / High)</div>
        <div>• Hindi -> व्याकरण (3 chapters) (Study / Med)</div>
        <div>• English -> 100 vocab + 50 idioms & phrases (Study / Med)</div>
        <div>• Canva -> 7 lessons (1 hour each) (Skills / Med)</div>
        <div>• NET -> 2 chapters (Exam Prep / High)</div>
      </div>
      <div class="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <button onclick="closeNotebookModal()" class="px-4 py-2 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-300">Close</button>
        <button onclick="importNotebookToCurrent()" class="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Import to Active Week</button>
      </div>
    </div>
  </dialog>

  <!-- Application Logic -->
  <script>
    const STORAGE_KEY = 'sunday_plan_app_data_v1';
    let appData = [];
    let activeWeekId = '';
    let currentFilter = 'all';
    let chartInstance = null;

    const SAMPLE_WEEKS = [
      {
        id: '2026-09-27',
        sundayDate: '2026-09-27',
        title: 'Week of Sunday, Sep 27',
        focusGoal: 'Weekly Plan (Till 3 October) - Action Research, NCERT 6 & 7, CDP and NET prep',
        tasks: [
          { id: 'v1', title: 'Finalize - Action Research Diagnostic Test', category: 'Research', priority: 'High', completed: false, notes: 'Complete test methodology & diagnostic rubrics (Till Oct 3)' },
          { id: 'v2', title: 'Reflective Journal (Re J) -> 1', category: 'Study', priority: 'High', completed: false, notes: 'Write & submit Reflective Journal entry 1' },
          { id: 'v3', title: 'Activities -> 6', category: 'Study', priority: 'Medium', completed: false, notes: 'Draft and schedule 6 interactive activities' },
          { id: 'v4', title: 'Class 6 & 7 -> NCERT', category: 'Study', priority: 'High', completed: false, notes: 'Cover foundational NCERT textbooks for Class 6 & 7' },
          { id: 'v5', title: 'CDP -> Complete', category: 'Exam Prep', priority: 'High', completed: false, notes: 'Child Development & Pedagogy core syllabus completion' },
          { id: 'v6', title: 'Hindi -> व्याकरण (3 chapters)', category: 'Study', priority: 'Medium', completed: false, notes: 'Hindi Grammar chapters 1-3 with exercises' },
          { id: 'v7', title: 'English -> 100 vocab + 50 idioms & phrases (every week)', category: 'Study', priority: 'Medium', completed: false, notes: 'Weekly recurring target: flashcards & usage drills' },
          { id: 'v8', title: 'Canva -> 7 lessons (1 hour each)', category: 'Skills', priority: 'Medium', completed: false, notes: 'Digital design skills practice, 1 hour daily' },
          { id: 'v9', title: 'NET -> 2 chapters', category: 'Exam Prep', priority: 'High', completed: false, notes: 'UGC NET curriculum revision: chapters 1 & 2' }
        ]
      }
    ];

    function init() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          appData = JSON.parse(stored);
        } catch (e) {
          appData = SAMPLE_WEEKS;
        }
      } else {
        appData = SAMPLE_WEEKS;
        saveData();
      }

      activeWeekId = appData[appData.length - 1]?.id || '2026-09-27';
      
      // Sunday check
      if (new Date().getDay() === 0) {
        const banner = document.getElementById('sunday-alert-banner');
        if (banner) banner.classList.remove('hidden');
      }

      updateWeekSelector();
      renderCurrentWeek();
      renderProgressBoard();
      lucide.createIcons();
    }

    function saveData() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    }

    function getActiveWeek() {
      return appData.find(w => w.id === activeWeekId) || appData[appData.length - 1];
    }

    function updateWeekSelector() {
      const sel = document.getElementById('week-selector');
      if (!sel) return;
      sel.innerHTML = appData.map(w => \`<option value="\${w.id}" \${w.id === activeWeekId ? 'selected' : ''}>\${w.title}</option>\`).join('');
    }

    function onSelectWeek(id) {
      activeWeekId = id;
      renderCurrentWeek();
    }

    function switchView(view) {
      document.title = (view === 'current' ? 'Weekly Planning' : 'Weekly History') + ' | WeeklyPlan';
      document.getElementById('nav-current-btn').setAttribute('aria-pressed', String(view === 'current'));
      document.getElementById('nav-history-btn').setAttribute('aria-pressed', String(view !== 'current'));
      const vCurrent = document.getElementById('view-current');
      const vHistory = document.getElementById('view-history');
      const navCur = document.getElementById('nav-current-btn');
      const navHis = document.getElementById('nav-history-btn');

      if (view === 'current') {
        vCurrent.classList.remove('hidden');
        vHistory.classList.add('hidden');
        navCur.className = 'text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5';
        navHis.className = 'text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5';
        renderCurrentWeek();
      } else {
        vCurrent.classList.add('hidden');
        vHistory.classList.remove('hidden');
        navHis.className = 'text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5';
        navCur.className = 'text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5';
        renderProgressBoard();
      }
      lucide.createIcons();
    }

    function setFilter(filter) {
      currentFilter = filter;
      ['all', 'remaining', 'completed'].forEach(f => {
        const btn = document.getElementById('filter-' + f);
        btn.setAttribute('aria-pressed', String(f === filter));
        if (f === filter) {
          btn.className = 'px-3.5 py-1.5 text-xs font-semibold rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs';
        } else {
          btn.className = 'px-3.5 py-1.5 text-xs font-medium rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white';
        }
      });
      renderTasks();
    }

    function renderCurrentWeek() {
      const week = getActiveWeek();
      if (!week) return;

      document.getElementById('current-week-title').textContent = week.title;
      document.getElementById('current-week-goal').textContent = week.focusGoal ? \`Focus: \${week.focusGoal}\` : 'No weekly focus goal specified';

      const total = week.tasks.length;
      const completed = week.tasks.filter(t => t.completed).length;
      const remaining = total - completed;
      const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

      document.getElementById('gauge-percent').textContent = pct + '%';
      const circle = document.getElementById('gauge-circle');
      const circumference = 2 * Math.PI * 42; // ~263.89
      const offset = circumference - (pct / 100) * circumference;
      circle.style.strokeDashoffset = offset;

      const badge = document.getElementById('status-badge');
      if (pct === 100) {
        badge.textContent = 'All Tasks Completed! 🎉';
        badge.className = 'inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      } else if (pct >= 50) {
        badge.textContent = 'Almost There!';
        badge.className = 'inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      } else if (pct > 0) {
        badge.textContent = 'In Progress';
        badge.className = 'inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      } else {
        badge.textContent = 'Planning Mode';
        badge.className = 'inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700';
      }

      document.getElementById('stat-completed').textContent = completed;
      document.getElementById('stat-total').textContent = total;
      document.getElementById('stat-remaining').textContent = remaining;
      document.getElementById('stat-progress-bar').style.width = pct + '%';

      document.getElementById('count-all').textContent = total;
      document.getElementById('count-remaining').textContent = remaining;
      document.getElementById('count-completed').textContent = completed;

      document.getElementById('priority-high-count').textContent = week.tasks.filter(t => t.priority === 'High').length;
      document.getElementById('priority-med-count').textContent = week.tasks.filter(t => t.priority === 'Medium').length;
      document.getElementById('priority-low-count').textContent = week.tasks.filter(t => t.priority === 'Low').length;

      renderTasks();
    }

    function renderTasks() {
      const week = getActiveWeek();
      const container = document.getElementById('task-list');
      if (!week || !container) return;

      const search = (document.getElementById('task-search-input')?.value || '').toLowerCase();

      let filtered = week.tasks.filter(t => {
        if (currentFilter === 'remaining') return !t.completed;
        if (currentFilter === 'completed') return t.completed;
        return true;
      });

      if (search) {
        filtered = filtered.filter(t => t.title.toLowerCase().includes(search) || (t.notes && t.notes.toLowerCase().includes(search)));
      }

      if (filtered.length === 0) {
        container.innerHTML = \`
          <div class="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900/50">
            <p class="text-sm font-medium text-neutral-600 dark:text-neutral-400">No tasks found</p>
            <p class="text-xs text-neutral-400 mt-1">Add a new task or adjust your search / filter.</p>
          </div>
        \`;
        return;
      }

      container.innerHTML = filtered.map(task => \`
        <div class="group flex items-start justify-between gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all \${task.completed ? 'opacity-70 bg-neutral-50/50 dark:bg-neutral-900/50' : ''}">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <input
              type="checkbox"
              \${task.completed ? 'checked' : ''}
              aria-label="Toggle task completion" onchange="toggleTask('\${task.id}')"
              class="mt-1 w-4 h-4 text-emerald-600 rounded border-neutral-300 dark:border-neutral-700 focus:ring-emerald-500 cursor-pointer"
            />
            <div class="flex-1 min-w-0">
              <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100 block truncate \${task.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : ''}">
                \${task.title}
              </span>
              \${task.notes ? \`<p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">\${task.notes}</p>\` : ''}
              <div class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                <span>\${task.category}</span>
                <span>·</span>
                <span class="\${task.priority === 'High' ? 'text-rose-600 font-semibold' : task.priority === 'Medium' ? 'text-amber-600 font-semibold' : 'text-blue-600 font-semibold'}">\${task.priority}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1 opacity-100 transition-opacity">
            <button aria-label="Edit task" onclick="editTask('\${task.id}')" class="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded">
              <i aria-hidden="true" data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
            <button aria-label="Delete task" onclick="deleteTask('\${task.id}')" class="p-1.5 text-neutral-400 hover:text-rose-600 rounded">
              <i aria-hidden="true" data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      \`).join('');

      lucide.createIcons();
    }

    function toggleTask(id) {
      const week = getActiveWeek();
      if (!week) return;
      const task = week.tasks.find(t => t.id === id);
      if (!task) return;

      task.completed = !task.completed;
      saveData();
      renderCurrentWeek();

      const total = week.tasks.length;
      const completed = week.tasks.filter(t => t.completed).length;
      if (total > 0 && total === completed) {
        triggerConfettiCelebration();
      }
    }

    function triggerConfettiCelebration() {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }

    function openTaskModal(taskId = null) {
      const modal = document.getElementById('task-modal');
      const editInput = document.getElementById('task-edit-id');
      const titleInput = document.getElementById('task-title-input');
      const catInput = document.getElementById('task-category-input');
      const priInput = document.getElementById('task-priority-input');
      const noteInput = document.getElementById('task-notes-input');

      if (taskId) {
        const week = getActiveWeek();
        const task = week.tasks.find(t => t.id === taskId);
        if (task) {
          editInput.value = task.id;
          titleInput.value = task.title;
          catInput.value = task.category || 'Study';
          priInput.value = task.priority || 'Medium';
          noteInput.value = task.notes || '';
          document.getElementById('task-modal-title').textContent = 'Edit Task';
        }
      } else {
        editInput.value = '';
        titleInput.value = '';
        catInput.value = 'Study';
        priInput.value = 'Medium';
        noteInput.value = '';
        document.getElementById('task-modal-title').textContent = 'Add New Task';
      }

      modal.showModal();
      document.body.style.overflow = 'hidden';
    }

    function closeTaskModal() {
      const modal = document.getElementById('task-modal');
      modal.close();
      document.body.style.overflow = '';
    }

    function handleSaveTask(e) {
      e.preventDefault();
      const week = getActiveWeek();
      if (!week) return;

      const editId = document.getElementById('task-edit-id').value;
      const title = document.getElementById('task-title-input').value.trim();
      const category = document.getElementById('task-category-input').value;
      const priority = document.getElementById('task-priority-input').value;
      const notes = document.getElementById('task-notes-input').value.trim();

      if (editId) {
        const task = week.tasks.find(t => t.id === editId);
        if (task) {
          task.title = title;
          task.category = category;
          task.priority = priority;
          task.notes = notes;
        }
      } else {
        week.tasks.push({
          id: 'task-' + Date.now(),
          title,
          category,
          priority,
          notes,
          completed: false
        });
      }

      saveData();
      closeTaskModal();
      renderCurrentWeek();
    }

    function deleteTask(id) {
      const week = getActiveWeek();
      if (!week) return;
      week.tasks = week.tasks.filter(t => t.id !== id);
      saveData();
      renderCurrentWeek();
    }

    function editTask(id) {
      openTaskModal(id);
    }

    function openNewWeekModal() {
      const modal = document.getElementById('new-week-modal');
      const dateInput = document.getElementById('new-week-date');
      const today = new Date();
      const nextSun = new Date(today);
      nextSun.setDate(today.getDate() + ((7 - today.getDay()) % 7 || 7));
      dateInput.value = nextSun.toISOString().split('T')[0];

      modal.showModal();
      document.body.style.overflow = 'hidden';
      lucide.createIcons();
    }

    function closeNewWeekModal() {
      const modal = document.getElementById('new-week-modal');
      modal.close();
      document.body.style.overflow = '';
    }

    function handleCreateNewWeek(e) {
      e.preventDefault();
      const sundayDate = document.getElementById('new-week-date').value;
      const focusGoal = document.getElementById('new-week-goal').value.trim();
      const carryOver = document.getElementById('new-week-carryover').checked;

      const dateObj = new Date(sundayDate);
      const title = 'Week of Sunday, ' + dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      let newTasks = [];
      if (carryOver && appData.length > 0) {
        const lastWeek = appData[appData.length - 1];
        newTasks = lastWeek.tasks.filter(t => !t.completed).map(t => ({
          ...t,
          id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          completed: false
        }));
      }

      const newWeek = {
        id: sundayDate,
        sundayDate,
        title,
        focusGoal,
        tasks: newTasks
      };

      appData.push(newWeek);
      activeWeekId = newWeek.id;
      saveData();
      closeNewWeekModal();
      updateWeekSelector();
      switchView('current');
    }

    function openNotebookModal() {
      const m = document.getElementById('notebook-modal');
      m.showModal();
      document.body.style.overflow = 'hidden';
    }

    function closeNotebookModal() {
      const m = document.getElementById('notebook-modal');
      m.close();
      document.body.style.overflow = '';
    }

    function importNotebookToCurrent() {
      const week = getActiveWeek();
      if (!week) return;

      const tasksToImport = [
        { title: 'Finalize - Action Research Diagnostic Test', category: 'Research', priority: 'High', notes: 'Till 3 October' },
        { title: 'Reflective Journal (Re J) -> 1', category: 'Study', priority: 'High', notes: 'Write & submit Reflective Journal entry 1' },
        { title: 'Activities -> 6', category: 'Study', priority: 'Medium', notes: '6 classroom activities' },
        { title: 'Class 6 & 7 -> NCERT', category: 'Study', priority: 'High', notes: 'NCERT textbooks' },
        { title: 'CDP -> Complete', category: 'Exam Prep', priority: 'High', notes: 'Pedagogy syllabus' },
        { title: 'Hindi -> व्याकरण (3 chapters)', category: 'Study', priority: 'Medium', notes: 'Chapters 1-3' },
        { title: 'English -> 100 vocab + 50 idioms & phrases', category: 'Study', priority: 'Medium', notes: 'Weekly recurring' },
        { title: 'Canva -> 7 lessons (1 hour each)', category: 'Skills', priority: 'Medium', notes: '1 hr daily' },
        { title: 'NET -> 2 chapters', category: 'Exam Prep', priority: 'High', notes: 'UGC NET chapters 1-2' }
      ];

      tasksToImport.forEach(t => {
        week.tasks.push({
          id: 'nb-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          ...t,
          completed: false
        });
      });

      saveData();
      closeNotebookModal();
      renderCurrentWeek();
    }

    function renderProgressBoard() {
      const grid = document.getElementById('weeks-grid');
      if (!grid) return;

      grid.innerHTML = appData.slice().reverse().map(w => {
        const total = w.tasks.length;
        const comp = w.tasks.filter(t => t.completed).length;
        const unfin = total - comp;
        const pct = total === 0 ? 0 : Math.round((comp / total) * 100);

        let badgeBg = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900';
        if (pct === 100) badgeBg = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
        else if (pct >= 50) badgeBg = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900';

        return \`
          <div class="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 cursor-pointer transition-all space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400">\${w.sundayDate}</span>
              <span class="text-xs font-bold px-2 py-0.5 rounded border \${badgeBg} tabular-nums">\${pct}% Done</span>
            </div>
            <div>
              <h3 class="text-base font-bold text-neutral-900 dark:text-white"><button type="button" onclick="inspectWeek('\${w.id}')">\${w.title}</button></h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">\${w.focusGoal || 'No goal set'}</p>
            </div>
            <div class="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-center">
              <div>
                <span class="text-[10px] text-neutral-400 block uppercase">Total</span>
                <span class="text-sm font-bold tabular-nums">\${total}</span>
              </div>
              <div>
                <span class="text-[10px] text-neutral-400 block uppercase">Done</span>
                <span class="text-sm font-bold text-emerald-600 tabular-nums">\${comp}</span>
              </div>
              <div>
                <span class="text-[10px] text-neutral-400 block uppercase">Left</span>
                <span class="text-sm font-bold text-rose-500 tabular-nums">\${unfin}</span>
              </div>
            </div>
          </div>
        \`;
      }).join('');

      renderChart();
    }

    function inspectWeek(id) {
      activeWeekId = id;
      updateWeekSelector();
      switchView('current');
    }

    function renderChart() {
      const ctx = document.getElementById('progressChart');
      if (!ctx) return;

      const labels = appData.map(w => w.title.replace('Week of Sunday, ', ''));
      const data = appData.map(w => {
        const total = w.tasks.length;
        const comp = w.tasks.filter(t => t.completed).length;
        return total === 0 ? 0 : Math.round((comp / total) * 100);
      });

      if (chartInstance) {
        chartInstance.destroy();
      }

      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Completion %',
            data,
            backgroundColor: data.map(pct => pct === 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'),
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: v => v + '%' }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    function toggleTheme() {
      const isDark = document.documentElement.classList.toggle('dark');
      document.getElementById('theme-icon').setAttribute('data-lucide', isDark ? 'sun' : 'moon');
      lucide.createIcons();
      if (chartInstance) renderChart();
    }

    document.querySelectorAll('dialog').forEach(dialog => {
      dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
      dialog.addEventListener('cancel', () => { document.body.style.overflow = ''; });
    });
    window.onload = init;
  </script>
</body>
</html>`;
}
