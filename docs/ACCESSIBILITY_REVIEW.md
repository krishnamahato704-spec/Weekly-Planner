# Accessibility and SEO review

The planner now uses native, named dialogs, associated form labels, keyboard controls, stronger text contrast, and metadata for its public origin:

https://weekly-planner-krishnamahato704.krishnamahato704.chatgpt.site/

## Changes

- Migrated 24 overlay dialogs and prompts to the shared `Dialog` component. Native modal behavior isolates the background; the component cycles focus, closes with Escape, restores the trigger, and preserves body scrolling across overlapping dialogs.
- Associated previously unassociated text, date, time, select, textarea, and file fields with labels and unique React IDs. Repeated subject fields include their row index. Existing correctly labelled fields remain intact.
- Named icon buttons, hid decorative Lucide icons, exposed selected options with `aria-pressed`, and added `aria-expanded` to book disclosures. Chapter checkboxes include the chapter title in their accessible names.
- Replaced mouse-only week-card and book-header actions with native buttons. The upload target uses a native file control. Transcribed task selection uses a label and checkbox so Space works.
- Added keyboard focus to scrollable read-only regions and alert semantics to errors. Preserved the skip link, navigation landmarks, task labels, and status notifications.
- Fixed the duplicate H1 in the embedded academic audit, made dialog titles H2, and corrected notebook heading levels. Each primary view has one H1. Navigation updates the document title and moves focus into the new view.
- Darkened faint light-theme text and corrected dark-theme secondary text and status colors. Form boundaries and focus indicators have explicit contrast. Reduced-motion styles remain available.
- Updated the standalone HTML export with named native dialogs, labels, keyboard actions, phone navigation, chart alternatives, headings, contrast, and a `noindex` directive.

## Metadata and hosting

The HTML includes an English language declaration, descriptive title and description, canonical URL, Open Graph site name/title/description/type/URL, X summary metadata, theme colors, a custom favicon, and factual WebApplication structured data. A no-JavaScript message explains the planner's purpose and browser-storage requirement.

Vite generates `robots.txt` and a one-URL sitemap. The application uses client-side views at the root URL; there are no independently addressable detail pages to include. Personal task data lives in browser storage and is absent from the sitemap and structured data. No social-preview image was supplied or requested.

`VITE_SITE_URL` can override the public origin at build time. The validator accepts HTTPS origins without credentials, paths, query strings, or fragments and keeps canonical, sharing, structured-data, robots, and sitemap URLs consistent.

The optional `build:site` command produces a self-contained Cloudflare-compatible Worker. It serves the same hashed client assets with immutable caching, revalidates HTML, returns 404 for unknown paths, and retains the health and transcription endpoints. Express and the Worker share the handwriting parser. Transcription still requires `GEMINI_API_KEY`; no provider key or private planner data is included in the build.

## Validation

- TypeScript and production Vite builds passed.
- Ten existing task/server tests passed. The provider was not called.
- Axe-core 4.10.3 found zero violations in 44 planner view/theme states and 46 component/theme states using WCAG 2 A/AA, WCAG 2.1 A/AA, and best-practice tags. Motion was disabled to measure final colors rather than transition frames.
- Six additional upload/import states passed; Space toggled a transcribed task and the rendered controls had no duplicate IDs. These component fixtures exclude unrelated document/landmark rules.
- Ten standalone-export states passed in both themes.
- All 22 component dialogs passed eight keyboard checks: name, native background isolation, initial focus, forward/backward Tab cycling, Escape, focus restoration, and scroll restoration.
- 374 planner layout checks and 115 dialog layout checks passed at phone, tablet, desktop, and landscape sizes. No horizontal overflow or targets below the project's 44 px requirement were found.
- Browser regressions passed for lazy loading, task filters, linked NCERT completion, timer cleanup, chart reuse, navigation, upload limits, and cancellation.
- The hosted Worker has separate tests for assets, crawler metadata, caching, 404/HEAD behavior, input validation, request limits, and missing credentials.

Automated checks do not establish full WCAG conformance. Screen-reader testing with NVDA/VoiceOver, text-spacing and browser-zoom checks, and representative users remain manual follow-up work. Search indexing and rich-result eligibility depend on the search engine; metadata does not guarantee either.

Reference: [WCAG 2.1](https://www.w3.org/TR/WCAG21/), [WAI dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [Google SEO guidance](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [Open Graph metadata](https://ogp.me/).
