# Weekly-Planner

A React 19 and TypeScript weekly planner built with Vite and Tailwind CSS. Express serves the application and provides the optional handwritten-plan transcription endpoint.

## Run locally

Install the dependencies with Bun using the committed lockfile, then start the development server:

```sh
bun install --frozen-lockfile
bun run dev
```

The server uses port 3000 by default. Set `PORT` to choose another port. Optional transcription requires both `GEMINI_API_KEY` and a separate random `TRANSCRIPTION_ACCESS_TOKEN` of 32–256 characters in the server environment or a local `.env` file. Authorized users enter the access code when prompted. The planner and health endpoint work without these secrets. Keep them out of client build variables and source control.

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

See [the accessibility and SEO review](docs/ACCESSIBILITY_REVIEW.md) for keyboard behavior, labels, contrast, page metadata, and validation limits.

See [the security and reliability review](docs/SECURITY_REVIEW.md) for input validation, API protections, data recovery, verified failure cases, and deployment limits.

## Public deployment build

The public origin is configured in `site.config.ts`; set `VITE_SITE_URL` when deploying at another HTTPS origin. Use Node 24 LTS or another version supported by Vite.

```sh
bun run build:site
bun run test:site
```

This produces a Cloudflare-compatible Worker at `dist/server/index.js` with the client assets embedded. Keep the normal `build` and `start` commands for Express hosting. Both runtimes use the same optional Gemini transcription parser.

## Netlify deployment

The existing project is `weekly-plannerkrissh` at [weekly-plannerkrissh.netlify.app](https://weekly-plannerkrissh.netlify.app). Its project ID is `1a175af2-054a-4138-820e-66c46b23b200`.

`netlify.toml` builds the Vite client into `dist` and bundles `netlify/functions/api.mts`. The function serves `/api/health` and `/api/ai/parse-handwritten-plan`, reusing the same validation and transcription parser as the other runtimes. Security headers apply to static files and API responses. This deployment caps JSON uploads at 4 MiB and returns a timeout before Netlify's function deadline. The image upload dialog checks the deployment's limit before sending a request.

For local development, install the Netlify CLI and run `netlify dev`. To publish the current checkout to the existing project:

```sh
netlify link --id 1a175af2-054a-4138-820e-66c46b23b200
netlify deploy --prod
```

Keep `GEMINI_API_KEY` and `TRANSCRIPTION_ACCESS_TOKEN` in Netlify environment variables with Functions scope. Without both configured correctly, image transcription stays unavailable with a readable error; task entry and the rest of the planner work normally. Do not put these secrets in `netlify.toml` or `VITE_` variables.

A manual deployment preserves the project's GitHub connection. Git deployments follow the production branch configured in Netlify, so merge reviewed changes into that branch before relying on subsequent automatic builds. Planner records are stored in each browser; publishing does not copy records between hosting origins.
