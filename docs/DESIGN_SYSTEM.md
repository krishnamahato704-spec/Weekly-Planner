# WeeklyPlan interface redesign

The weekly checklist is now the main surface. Persistent navigation lives in a desktop sidebar, and progress, weekly focus, and priority counts sit in a secondary column. Below 1280px the columns stack; below 1024px navigation opens in a drawer. The layout adapts to the available space without hiding task actions.

## What changed

The previous header combined five destinations and several utility actions in one crowded row. The weekly view repeated the completion count in multiple cards, used several competing accent colors, and gave each task its own card. Small icon controls and clickable text made some actions harder to use with touch or a keyboard.

The new shell shares its navigation data and content between the sidebar and mobile drawer. The checklist uses rows inside one panel, with a clear quick-entry form, completion filters, search, priority filtering, and sorting. Progress appears once in the adjacent overview. Task titles are buttons, completion uses labeled checkboxes, and edit/delete controls have task-specific accessible names. Empty states offer an action or a way to clear filters.

Analytics and history share page headers, metric cards, and view controls. Calendar controls use the same button and field styles. Its small-screen summary no longer has fixed-width boxes that overflow. Academic Tracks now exposes its existing program selection through a labeled select. Study panels use the same surface treatment and slate palette; subject and completion colors remain available where they convey information.

## Tokens and classes

`src/index.css` defines Tailwind 4 theme values and semantic CSS variables. The `.dark` class changes the variables and native color scheme. Components can use the semantic classes together with Tailwind layout utilities.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--canvas` | `#f7f8fc` | `#101522` | Application background |
| `--surface` | `#ffffff` | `#171f30` | Cards, forms, navigation |
| `--surface-muted` | `#f3f5f9` | `#1e283a` | Inset controls and tracks |
| `--ink` | `#182235` | `#ecf0f8` | Main text |
| `--muted` | `#637087` | `#a1afc5` | Supporting text |
| `--line` | `#e5e9f1` | `#2b3549` | Dividers and boundaries |
| `--accent` | `#4f46e5` | `#a5b4fc` | Selected navigation and emphasis |
| `--success` | `#15805e` | `#73d3b1` | Completion |

Primary buttons retain a white label on an indigo `#4f46e5` background in both themes. Priority uses subdued rose, amber, and blue values. Labels and counts accompany status colors. A partial completion rate no longer turns a chart bar red.

Use these shared classes:

- `surface`: themed card background, border, 14px radius, and a small shadow.
- `button button-primary`, `button button-secondary`: 44px minimum-height actions.
- `icon-button`, `icon-button-danger`: 44px icon controls with visible hover and focus states.
- `field`, `field-label`: inputs, selects, and labels. Fields use 16px text at widths up to 820px.
- `page-title`, `page-description`, `section-title`, `eyebrow`, `text-muted`: the text hierarchy.
- `segmented-control`, `segment`: mutually exclusive options represented as a labeled group of toggle buttons.
- `wrap-controls`, `chapter-controls`: wrapping control groups with 44px touch targets.
- `card-grid`, `compact-card-grid`, `class-progress-grid`: columns sized by the available container width.
- `modal-panel`: a scrollable dialog surface constrained by the dynamic viewport height.

Class and subject navigation uses labeled selects below 768px. Larger screens use wrapping buttons. Chapter rows stay stacked until 1536px, so their checklists have space beside the desktop sidebar. Long task titles, categories, notes, and week names can wrap inside cards. See [the responsive review](RESPONSIVE_REVIEW.md) for the viewport matrix and validation limits.

The font request now contains only Plus Jakarta Sans. Both Tailwind's `font-sans` and display text use the same family with system fallbacks. The original request included extra families; the UI no longer depends on them. Georgia remains a local serif fallback for existing notebook text.

## Reusable components

`src/components/ui/Primitives.tsx` provides `PageHeader`, `StatCard`, and a typed `SegmentedControl`. `src/components/ui/Dialog.tsx` wraps the native dialog element. Shared navigation definitions are in `src/components/navigation.ts`; `NavigationContent` renders both navigation surfaces. The weekly view contains a focused `TaskRow` and keeps the existing memoized selection and summary utilities.

```tsx
<PageHeader
  eyebrow="Your study tracks"
  title="Academic Tracks"
  description="Follow each chapter from reading and deep study to revision."
  actions={<button className="button button-primary" onClick={openTrackForm}>Add Track</button>}
/>

<section className="surface p-6">
  <h2 className="section-title">Study notes</h2>
  <label className="field-label mt-4" htmlFor="study-notes">Notes</label>
  <textarea id="study-notes" className="field" rows={3} />
</section>
```

```tsx
<SegmentedControl
  label="Task completion filter"
  value={filter}
  onChange={setFilter}
  options={[
    { value: 'all', label: 'All' },
    { value: 'remaining', label: 'Remaining' },
    { value: 'completed', label: 'Done' },
  ]}
/>
```

## Interaction and accessibility

Hover states change background or text without moving the layout. Pressed buttons move by 1px. Progress bars animate their width; screen entrances use a short opacity/translation transition. CSS disables these transitions and animations when reduced motion is requested. Charts also disable animation for that preference, and the application skips confetti.

The task form and navigation drawer use native modal dialogs, contain Tab/Shift+Tab focus, close on Escape, lock background scrolling, and restore focus to the opening control. Task form labels are associated with their fields. A skip link leads to the main region, selected navigation exposes `aria-current`, toggle groups expose `aria-pressed`, and notifications use a status region. These choices follow the [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) and the browser's [reduced-motion preference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).

This is not a claim of full WCAG conformance. Other legacy dialogs retain their existing implementation, and a complete screen-reader audit was not run. The standalone HTML export retains its separate template.

## Verification

- Production build and TypeScript check passed.
- All 10 existing utility and server tests passed.
- An isolated headless Edge run checked weekly planning, calendar, academic tracks, and NCERT for page overflow at 320, 390, 768, 1024, and 1440px.
- Browser checks covered task creation, initial dialog focus, Tab/Shift+Tab containment, Escape, focus restoration, body scroll restoration, drawer navigation, and reduced-motion styles.
- Existing regression checks covered sorting, trimmed search, linked NCERT completion, lazy views, chart reuse, timer cleanup, oversized upload rejection, and aborting an in-flight scan. No page errors occurred.
- Light, dark, desktop, mobile, analytics, history, study-view, task-form, and drawer screenshots were inspected. Screenshots use illustrative data in an isolated browser context.

No new runtime dependency was added. Optional views and dialogs remain lazy-loaded. Verification used Edge; Safari and Firefox were not tested.
