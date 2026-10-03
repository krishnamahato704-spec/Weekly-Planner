# Performance review

Reviewed on 3 October 2026. The baseline is commit `04c6f86029ac4e63026adecc4fac0257edb3d697` in `krishnamahato704-spec/Weekly-Planner`.

The application uses React 19, TypeScript, Vite, Tailwind CSS, Chart.js, and Express. Vue is not used. Changes focus on the active planner, analytics, calendar, academic tracks, optional dialogs, and server resource lifecycle.

## Findings and changes

| Finding | Change |
| --- | --- |
| `App.tsx` imported every major view, all global dialogs, the standalone HTML template, and confetti at startup. | Optional views and dialogs use module-level React lazy imports and Suspense. Closed global dialogs unmount. Confetti loads on the first celebration. The weekly checklist remains eager. |
| The progress chart's sorted array changed identity on every render. Opening the inspector destroyed and reconstructed the chart; cleanup could also destroy the same instance twice. | Memoized summaries drive the chart. Separate effects manage chart lifetime and data/theme updates. The chart recreates only when its type changes and is destroyed once on cleanup. Only the bar/line controllers, elements, scales, tooltip, and filler are registered. |
| Weekly filtering generated a new array every render, defeating the sort memo. Counters scanned the task list repeatedly, including when typing into quick-add. The rendered list used `filteredTasks` instead of `sortedTasks`. | Shared task selectors and summaries handle filtering, stable sorting, counting, and calendar indexing. Memo dependencies track the actual task data and filters. The rendered list now uses the selected sort order, and search trims surrounding spaces. Week-selector counts are cached too. |
| Task editing, deletion, and rescheduling rebuilt unrelated week objects. Linked completion actions relied on variables assigned inside a deferred/replayable state updater. | `updateTaskInWeeks` preserves untouched references. Completion metadata and linked NCERT actions are derived in the event handler; state updaters only return new state. |
| Planning all revisions ran one state update and a linear chapter search per revision. Recurring/carry-over selection repeatedly searched arrays. | Revisions are created and inserted in one update, preserving their previous prepend order. Sets handle chapter membership, selected IDs, and recurring-title deduplication. |
| Analytics and academic-track summaries flattened, filtered, and rescanned static data on unrelated renders. Month blocks scanned all tasks separately for each week. | Aggregates use memoized passes; month blocks read a date index. Month navigation starts from day one to avoid skipping short months. |
| Every flat-chapter lookup rebuilt all NCERT metadata objects. Revision calculations read the current date separately for each chapter. | Flat lookups copy the precomputed array; chapter metadata is treated as immutable. Each revision batch uses one date snapshot. |
| Toasts and several delayed dialog actions retained callbacks until timeout, with no owner cleanup. An older toast timer could dismiss a newer notification. The drawer's focus timer had no cleanup. | `useTimeout` replaces an owner's pending timer and cancels it on unmount. It refuses to schedule work after the owner unmounts. The drawer clears its focus timer. Existing chart and study-interval cleanup is retained. |
| Upload scans and file reads continued after closing or replacing the image; parsed task toggles mutated existing task objects. | File reads and fetches abort on close/unmount or image replacement. Aborted responses do not update state. A 16 MiB file limit leaves room for base64 and JSON inside the server's 25 MiB body limit. Task selection updates are immutable. |
| Standalone HTML regenerated after copy-state changes. Academic completion triggered confetti twice through both the component and its parent. | The export is memoized for each opening, clipboard success is awaited, and the duplicate celebration is removed. |
| The server imported development tooling and the AI SDK even when serving the planner without AI. Client disconnects did not cancel the SDK request. Hashed assets had no long-term cache policy. | Vite loads only in development; the SDK and reusable AI client initialize on the first valid AI request. The route validates input types, parses large JSON only on that endpoint, applies a 60-second SDK timeout, and passes a cancellation signal tied to the response connection. Hashed assets receive immutable caching. |
| Tailwind scanned the standalone export's separate page template. Vite's alias used a legacy `__dirname` reference. | The export template is excluded from app CSS scanning; it still supplies its own CDN stylesheet. The Vite alias uses `import.meta.dirname`. |

The chart already had an unmount cleanup. The observed problem there was repeated creation and destruction, not evidence of an accumulating chart leak. The timer and upload changes remove pending work and races; no long-duration heap-growth claim is made.

## Bundle measurements

Both builds used the same installed dependency set, Node 24.19.0, and Vite 8.3.2. Dependencies were resolved with pnpm for local validation because Bun was unavailable; the committed Bun lockfile was not regenerated. Sizes below use decimal kB. Gzip values were calculated consistently with Node's `gzipSync` defaults and are size estimates, not measured network transfer.

| Asset | Before | After | Change |
| --- | ---: | ---: | ---: |
| Initial JavaScript | 865.07 kB | 381.22 kB | 55.9% smaller |
| Initial JavaScript, gzip | 227.53 kB | 108.77 kB | 52.2% smaller |
| All JavaScript combined | 865.07 kB | 842.72 kB | 2.6% smaller |
| Sum of all JavaScript chunks, gzip | 227.53 kB | 238.54 kB | 4.8% larger |
| App CSS | 130.97 kB | 128.34 kB | 2.0% smaller |

The main saving is startup download and parsing. Loading every optional feature costs slightly more compressed data because each chunk compresses separately. The charts, export template, and larger views are fetched on first use, so a first visit to a view can show a loading indicator. There is no service worker or offline chunk cache.

No dependency was added for the refactor or its unit/server tests. Unused installed packages such as `motion` remain in the manifest; they were already absent from the client bundle, so removing them would affect installation size rather than these browser measurements.

## Validation

The production build and TypeScript check pass. Ten tests cover summary counts, arbitrary category names, composed search/priority/status filters, stable sorting, immutable updates/deletes, empty weeks, calendar counts, independent flat-chapter arrays, server startup without an AI key, malformed API input, missing-key handling, and asset cache headers.

An isolated headless Edge browser verified startup chunk loading, actual rendered sorting and trimmed search, the linked NCERT completion prompt and persistence, replacement of rapid toast timers, chart reuse during inspector/theme changes, chart recreation on type changes, calendar/academic/NCERT navigation, and mobile Escape handling without horizontal overflow. A separate component fixture verified timer cancellation on unmount, oversized-image rejection, and aborting a pending scan on close. No page errors were recorded. The progress chart was inspected after its animation completed.

The live Gemini service was not called. Its configured model and production latency have not been verified. Provider-side cancellation and timeout behavior were not exercised against a real request. Browser fetch cancellation was checked with a held mock response. No deployed-site load test, CPU profile, or long-duration heap snapshot was taken.

Closed global dialogs now release their component state and upload buffers. Unsaved dialog drafts do not survive closing. Persistent planner data retains its existing keys and format.

The review also found existing boundaries outside this refactor: several prepared features, including the Today dashboard and Google Calendar settings, are not wired into the main app; the Google Calendar component simulates a connection. Storage still serializes planner state synchronously and accepts only limited schema validation. Larger real datasets should be profiled before changing persistence or adding list virtualization.

The loading and lifecycle changes follow [React's lazy-loading guidance](https://react.dev/reference/react/lazy) and [effect cleanup guidance](https://react.dev/reference/react/useEffect). The chart imports follow [Chart.js integration guidance](https://www.chartjs.org/docs/latest/getting-started/integration.html); template exclusion uses [Tailwind source controls](https://tailwindcss.com/docs/detecting-classes-in-source-files).
