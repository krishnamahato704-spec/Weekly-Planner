# Weekly-Planner

A React 19 and TypeScript weekly planner built with Vite and Tailwind CSS. Express serves the application and provides the optional handwritten-plan transcription endpoint.

## Run locally

Install the dependencies with Bun using the committed lockfile, then start the development server:

```sh
bun install --frozen-lockfile
bun run dev
```

The server uses port 3000 by default. Set `PORT` to choose another port. Add `GEMINI_API_KEY` to your environment or a local `.env` file to use transcription. The planner and health endpoint work without this key.

## Check changes

```sh
bun run lint
bun run build
bun run test
```

Build before running the tests: the production asset-delivery test reads the generated `dist/assets` directory. The tests use Node's test runner through `tsx`, start a temporary server on an available port, and make no external AI calls.

For production, build first and run `bun run start` with `NODE_ENV=production`. Hashed assets receive a one-year immutable cache policy; application HTML revalidates. Serve the generated build together with this server to keep `/api/ai/parse-handwritten-plan` available.

See [the performance review](docs/PERFORMANCE_REVIEW.md) for the refactor, measurements, and validation limits.

See [the design system](docs/DESIGN_SYSTEM.md) for layout rules, shared CSS classes, reusable components, and interface validation.

See [the responsive review](docs/RESPONSIVE_REVIEW.md) for mobile, tablet, desktop, and landscape layout changes and validation.
