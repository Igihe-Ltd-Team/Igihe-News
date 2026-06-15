# IGIHE News

Next.js frontend and backend-for-frontend for IGIHE English news. WordPress is
the primary content source, with separate comments, traffic, advertising, and
AI integrations.

## Local Development

```bash
yarn install --frozen-lockfile
cp .env.example .env.local
yarn dev
```

The application runs at `http://localhost:3000`.

## Quality Checks

```bash
yarn lint
yarn typecheck
yarn test --runInBand
yarn build
```

GitHub Actions runs these checks for pull requests and pushes to `main`.

## Deployment

This project does not require Docker. Deploy it as a standard Node.js 22
application:

```bash
yarn install --frozen-lockfile
yarn build
NODE_ENV=production yarn start
```

Use a process supervisor such as systemd or PM2, terminate TLS at the load
balancer/reverse proxy, and route health checks to `GET /api/health`.

Required production configuration:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_WORDPRESS_API_URL`
- `REVALIDATION_SECRET`
- `ARTICLE_REFRESH_SECRET`
- `HEALTH_CHECK_SECRET`
- `GEMINI_API_KEY_1` when the news assistant is enabled

Never place credentials in a `NEXT_PUBLIC_*` variable. Those variables can be
included in browser bundles.

Privileged cache refresh calls must send `x-article-refresh-secret` or
`x-revalidate-secret` headers. Secrets in query strings or request bodies are
not accepted.

## Operations

- `/api/health` is the liveness probe. `/api/health?readiness=1` must return
  HTTP 200 before an instance receives traffic. Use `/api/health?deep=1` with
  `x-health-secret` for external dependency monitoring.
- WordPress content updates must call `/api/revalidate` with
  `x-revalidate-secret`. The endpoint clears only affected caches, refreshes
  data from WordPress, and warms the homepage before returning.
- Alert on elevated 5xx rates, WordPress latency, build failures, and health
  endpoint failures.
- Keep at least one previous build artifact available for rollback.
- Back up WordPress and test restoration regularly. Local `.cache` files are
  not durable production storage.

## Architecture Notes

- The Next.js application renders public pages and provides BFF routes.
- WordPress owns articles, categories, tags, authors, and advertisements.
- Cached content uses in-memory and local file caches today. These caches are
  per-instance. Shared cache infrastructure is not required for the current
  single-instance deployment.
- Anonymous page traffic should be served through a CDN with stale-on-error
  behavior.

## WordPress Instant Updates

Configure WordPress to send an authenticated `POST` webhook after create,
update, publish, unpublish, trash, and delete events. Include posts, categories,
tags, videos, opinions, advertorials, announcements, facts, and advertisements.

```http
POST https://en.igihe.com/api/revalidate
x-revalidate-secret: YOUR_REVALIDATION_SECRET
content-type: application/json

{"type":"post","slug":"article-slug","category":"business","action":"save"}
```

For advertisements use `{"type":"advertisement","action":"save"}`. For videos
use `{"type":"igh-yt-videos","id":123,"slug":"video-slug","action":"save"}`.
Category and tag changes should send their type and slug. Sending an empty body
performs a broad refresh.

Immediate visibility depends on WordPress successfully delivering this webhook.
The normal local cache TTL remains as a fallback and keeps page loads fast. This
single-instance setup does not require Redis; when multiple application
instances are introduced, deliver the webhook to every instance or add a shared
invalidation channel.

For automatic delivery, install
[`docs/wordpress-revalidation-mu-plugin.php`](docs/wordpress-revalidation-mu-plugin.php)
as `wp-content/mu-plugins/igihe-frontend-revalidation.php`, then add these
server-only constants to WordPress `wp-config.php`:

```php
define('IGIHE_FRONTEND_REVALIDATE_URL', 'https://en.igihe.com/api/revalidate');
define('IGIHE_FRONTEND_REVALIDATE_SECRET', 'same-value-as-REVALIDATION_SECRET');
```

See [Architecture Evolution](docs/architecture-evolution.md) for the staged
single-instance, 10x, and 100x scaling path.
