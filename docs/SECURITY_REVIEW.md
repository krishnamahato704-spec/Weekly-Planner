# Security and reliability review

Reviewed on 4 October 2026. This covers the React application, standalone HTML export, Express server, and hosted Worker. The application stores planner data in the browser. Its only provider-backed endpoint transcribes images or notes through Gemini; there is no application database, SQL query layer, shell command execution, or authenticated cookie session in this codebase.

## Findings and implemented changes

| Finding | Change |
| --- | --- |
| Standalone export inserted stored titles, categories, notes, and week names into HTML and inline action arguments. This allowed stored XSS. | Escape text and attributes, create selector options with `textContent`, and use encoded data attributes with delegated event listeners. The React application continues to render user text as text. |
| Resource links accepted executable URL schemes. | Accept HTTP/HTTPS links only, reject control characters and embedded credentials, and open links with `noopener,noreferrer`. |
| Imports and saved data were checked only superficially. Malformed nested data could break views or replace usable data. | Shared closed-schema validators check types, identifiers, duplicate IDs, dates, enums, arrays, numbers, and lengths. Parse at most 10 MiB of backup JSON and reject reserved prototype keys. Construct explicit fields rather than spreading imported objects into application state. |
| “Merge” replaced existing data, and backup exports omitted study history. | Merge weeks/tasks, programs/subjects/chapters, sessions, notes, and NCERT history by stable identifiers. Matching imported task/chapter records replace their matching records; other records remain. Completed NCERT stages are retained. Include actual study history, calendar settings, and preferences in exports. |
| Storage failures could leave a blank screen or falsely report successful saves. Initialization could overwrite damaged saved values. | Preserve damaged originals, use defaults in memory, display a save warning, queue pending values for retry, and offer a recovery download. Both save indicators reflect storage failures. |
| Restore/reset failures could report success while saving had failed. | Validate before applying changes, write a batch before updating React state, and roll back completed writes if a later write fails. Keep failure messages and dialogs visible. Download a safety backup before reset. Weekly reset clears completion while preserving all weeks and tasks; study reset clears recorded sessions. Full reset explicitly describes removal of custom tracks, notes, history, and settings. |
| Failed lazy loading or rendering had no usable fallback. | A root error boundary shows recovery download and reload controls. It logs the error name only. |
| A configured public AI endpoint allowed anonymous provider spending and weak request bounds. | Require a separate 32–256 character server access token when a provider key is present. Compare fixed-size token digests without an early-exit comparison. Reject wrong origins, sibling-site requests, simple non-JSON submissions, unsupported methods, and invalid bodies before provider execution. |
| Provider uploads, outputs, errors, and timeouts lacked consistent validation and safe handling. | Both runtimes cap request bodies at 25 MiB, including streamed Worker bodies without a declared length. Allow JPEG/PNG/WebP base64 images up to 16 MiB, check MIME signatures, limit notes to 10,000 characters, validate provider JSON up to 1 MiB and 500 tasks, and return fixed error messages. Enforce provider/client deadlines and abort work on cancellation. |
| Production pages lacked a restrictive script policy. Offline dependencies floated between versions. | Production CSP allows scripts from the application origin and blocks inline/evaluated scripts. Move theme bootstrap to a same-origin file. Add `nosniff`, a no-referrer policy, restricted browser capabilities, HTTPS HSTS, and uncached API responses. Pin the export’s four CDN scripts with SHA-384 integrity and anonymous cross-origin loading. Keep basic controls usable if those scripts fail. |

The API rejects browser cross-origin requests using Origin, Fetch Metadata, and JSON content-type checks. The separate access token protects the optional paid service from direct anonymous clients, which can forge browser headers. There are no cookie-authenticated state-changing routes requiring a separate synchronizer CSRF token at present. Reassess this if accounts or server-side planner storage are added.

## Validation

- TypeScript check and normal production build passed.
- 25 task, validation, storage, authorization, provider, and Express tests passed. Mock provider tests cover invalid output, redacted failures, deadlines, and cancellation without making paid calls.
- 5 tests of the built hosted Worker passed: static asset delivery, metadata, API failure states, security headers/origin/auth checks, streamed upload cancellation, and burst limits.
- 13 isolated Edge browser scenarios passed using synthetic data. These include hostile text, blocked inline scripts, preserved task metadata during edits, malformed/merged imports, corrupt/quota/blocked storage, a failed lazy view, access-code retry, invalid/unavailable service responses, failed/successful resets, and offline export with all external scripts blocked.
- Axe 4.10.3 reported no violations across 12 light/dark states of the main view and new recovery/error UI. The damaged-data banner also had no horizontal overflow at widths 320, 390, 768, and 1280 pixels. Automated checks do not establish complete WCAG compliance.
- The official npm advisory endpoint returned no advisories for the 178 installed package names/versions checked on 4 October 2026 local time. This is a point-in-time registry check, not evidence that all dependencies are vulnerability-free. The four export dependency URLs responded successfully and their computed integrity hashes matched the source.

## Deployment and data limits

The live planner works without AI credentials. Transcription remains unavailable until both server secrets are configured; manual task entry remains usable. Entered access codes remain in component memory and are cleared when the upload dialog closes. Provider keys are never delivered to the browser. Scanning sends the selected image to Gemini, and the upload UI explains this before scanning. Returned tasks require user review before import; the model has no tools, database access, or code-execution capability.

The request gate permits 20 requests per client per minute and two concurrent provider requests per process/Worker isolate. It expires entries and retains at most 1,024 client records. These limits are not distributed across instances. Before opening transcription to a large audience, add shared identity-based quotas and provider spending limits; a shared access code is not a multi-user account system. Configure the Express public origin through `APP_URL` when a proxy changes its visible origin. Rate limiting does not depend on untrusted Express forwarded-IP headers.

Browser planner data, backup files, and recovery downloads are plain JSON. They are not encrypted and can be read by people or extensions with access to that browser/profile or file. No cloud backup or account authentication is implemented. Recovery downloads contain preserved raw values and pending in-memory values; they are intended for recovery and are not directly accepted as regular backup envelopes.

Batch rollback is best effort because browser storage has no multi-key transactions. If rollback itself fails, the save warning remains; retain the safety/recovery download. Validation limits protect storage and rendering costs but image signature checks do not fully decode or verify an image. The provider must reject malformed image content. A dropped client request or aborted provider call cannot guarantee that the provider has not already billed work.

This review did not perform an independent penetration test, real-provider integration test, hosting infrastructure audit, or manual screen-reader audit.

## Reference guidance

The encoding, request-origin, and validation decisions follow the relevant [OWASP XSS guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), and [input validation guidance](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html). The findings and test results above come from this repository and its generated builds.
