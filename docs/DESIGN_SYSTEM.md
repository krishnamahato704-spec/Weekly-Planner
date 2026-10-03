# WeeklyPlan charcoal and emerald theme

The weekly workspace opens with a large introduction and progress summary. Learning tracks appear as portfolio cards, followed by the checklist and recent weekly logs. These components use existing planner data and keep the editing tools available.

## Tokens and typography

`src/styles/tokens.css` owns the semantic colors, spacing, type sizes, radii, shadows, and motion values. `src/styles/workspace.css` styles the portfolio components. `src/index.css` imports both files, maps the Tailwind palette, and styles shared navigation, controls, dialogs, and planning views.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--canvas` | `#f2f5f1` | `#101612` | Page background |
| `--surface` | `#ffffff` | `#18211b` | Cards and dialogs |
| `--surface-muted` | `#edf2ed` | `#202c24` | Inset controls |
| `--ink` | `#19271e` | `#edf4ed` | Main text |
| `--muted` | `#536258` | `#adbdaf` | Supporting text |
| `--line` | `#d8e2d9` | `#34463a` | Surface borders |
| `--control-border` | `#758579` | `#819b88` | Input and checkbox boundaries |
| `--accent` | `#096448` | `#95e8b6` | Links, selection, progress |
| `--accent-soft` | `#e0f2e7` | `#243d2c` | Navigation and icon backgrounds |
| `--button-fill` | `#166b4d` | `#95e8b6` | Primary actions |
| `--button-ink` | `#ffffff` | `#112218` | Primary action labels |
| `--hero-surface` | `#e4efe5` | `#1c2b21` | Intro panel |

DM Sans is the body family; Manrope is the display family. Both use system sans-serif fallbacks and swap font display. Caption, small, and body tokens are 12px, 13px, and 15px at the default root size. Section and page titles use `clamp()`. The hero scales from 36px to 64px. Form fields use at least 16px on small screens.

Spacing tokens range from 4px to 64px: `--space-1` through `--space-8`. Control, card, and hero radii are 12px, 20px, and 28px. Motion tokens are 160ms and 240ms.

The `.dark` class switches semantic values and native `color-scheme`. New visitors start in dark mode; an explicit saved light preference takes precedence. The same-origin `public/theme.js` applies the preference before React loads. React keeps theme-color metadata in sync. Status and subject colors retain text labels.

## Components and responsive layout

- `WorkspaceHero` contains the H1, week selection, new-week action, a link to the task heading, and actual completion summary.
- `TrackGrid` shows up to six real learning tracks. Progress derives from chapter steps or internship activities. Each card opens its corresponding track; the full selector remains available.
- `WeeklyLogs` shows the three most recent weeks with focus, completion, and an action to open each week. It sorts a copy and summarizes only visible weeks.
- `WorkspaceFooter` offers backup access, current storage status, and a back-to-top action that also moves keyboard focus to the main region.

The header uses a subdued translucent background and emerald primary actions. Desktop navigation uses an inset selection line. The mobile drawer shares the navigation definitions and styles. Calendar, analytics, study panels, task forms, and recovery UI inherit the shared theme. History chart colors come from semantic tokens and update without replacing the chart instance.

Cards have three columns from 1280px, two from 480px, and one below 480px. The hero stacks below 768px. Logs and footer controls wrap on small screens. Text containers allow wrapping; canvases are constrained to the available width. Buttons and touch controls retain 44px minimum targets.

Use `surface` for panels; `button button-primary` and `button button-secondary` for actions; `icon-button` for labeled icon controls; and `field` with `field-label` for forms. Text classes include `page-title`, `section-title`, `eyebrow`, `text-muted`, `text-accent`, and `text-success`. Layout helpers include `wrap-controls`, `card-grid`, `compact-card-grid`, and `class-progress-grid`.

## Motion and accessibility

Pointer hover lifts cards by 4px and adds a soft shadow. Action arrows move slightly; primary buttons change fill and shadow. Keyboard focus has a visible outline. Native progress elements have accessible labels. Reduced motion removes card and arrow movement and suppresses transitions, screen entrances, smooth scrolling, chart animation, and confetti.

Native dialogs, focus containment, Escape handling, focus restoration, skip navigation, labeled controls, status announcements, and storage recovery remain in place. Decorative icons are hidden from assistive technology. Headings use H1 for the page, H2 for sections, and H3 for cards.

The standalone downloadable HTML planner retains its separate export template. This theme does not change its rendering or security rules.

## Verification

The delivered `theme-validation.json` records checks for this revision. Theme checks cover 18 page or dialog states in both modes with axe 4.10.3, and each state at 320, 390, 480, 768, 820, 1024, 1280, and 1440px. Modal audits inspect the active dialog because the background is inert. Interaction checks cover theme persistence, track navigation, task creation and completion, log navigation, drawer dismissal, hover, reduced motion, and long-content wrapping.

TypeScript, production and hosted builds, the existing 25 code/server tests, and five Worker tests are checked before publication. Security/recovery browser regressions are also rerun against the themed build. No runtime dependency was added; optional views and dialogs remain lazy-loaded.

Verification uses Edge and automated accessibility rules. It does not establish full WCAG conformance or replace a manual screen-reader audit. Firefox and Safari were not tested.
