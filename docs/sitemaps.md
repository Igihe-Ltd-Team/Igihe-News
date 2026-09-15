# XML sitemaps

The sitemaps for en.igihe.com are generated files, not pages. A background job
keeps them in step with WordPress; route handlers only serve what the job wrote.

## URLs

| URL | Contents | Served from |
|---|---|---|
| `/sitemap-index.xml` (alias: `/sitemap.xml`) | Sitemap index listing every file below plus the news sitemap, each with the time its content last changed | `.cache/sitemaps/index.xml` |
| `/sitemap-pages.xml` | Home and static/nav pages (`/articles`, `/videos`, `/opinion`, `/advertorials`, `/announcements`, `/author`, `/services`) | `pages.xml` |
| `/sitemap-categories.xml` | One URL per WordPress category with published posts | `categories.xml` |
| `/sitemap-articles-N.xml` | Every published post, opinion, advertorial and announcement, oldest first, 40,000 per file | `articles-N.xml` |
| `/sitemap-videos.xml` | `/videos/<slug>` pages | `videos.xml` |
| `/sitemap-authors.xml` | Author archives with at least 5 published articles, aliases merged | `authors.xml` |
| `/news-sitemap.xml` | Google News sitemap: posts and opinions published in the last 48 hours | generated on request, cached 60 s |

`next.config.ts` rewrites the public names to `app/sitemaps/[name]/route.ts`.
`robots.txt` lists `/sitemap-index.xml` and `/news-sitemap.xml`.

**Search Console:** submit `https://en.igihe.com/sitemap-index.xml`. The old
`https://en.igihe.com/sitemap.xml` keeps working and serves the same index.

## Where `lastmod` comes from

Nothing is stamped with the build time.

- Articles and videos: the WordPress `modified_gmt`, or `date_gmt` if that is newer (scheduled posts).
- Category pages, home, `/articles`, `/opinion`, `/advertorials`, `/announcements`, `/videos`: publish time of the newest item they list.
- Author archives: publish time of the author's newest article (across merged aliases).
- `/author` and `/services`: no data-driven modification time exists, so no `<lastmod>` is emitted.
- Index entries: the moment that child file's content last changed. Files whose XML is byte-identical to the previous run keep their `lastmod`.

Priority and change frequency are fixed tiers (`src/lib/sitemap/config.ts`);
they are not ranking signals and are not worth tuning.

## How regeneration is triggered

1. **Publish/update/trash webhook** (`POST /api/revalidate`, sent by the
   WordPress mu-plugin): `buildRevalidationPlan` asks the scheduler for a
   regeneration. Requests within 20 s are coalesced into one run; trashed or
   unpublished content is removed from the inventory immediately.
2. **Hourly** incremental sync (`modified_after` query), as a catch-up if a
   webhook was lost.
3. **Daily** full sync that re-reads every article (~600 WordPress requests,
   a few minutes).
4. **Cold start**: with no inventory on disk the server first publishes the
   last 30 days of content (about a minute), then backfills everything.

The scheduler lives in `src/lib/sitemap/scheduler.ts` and starts from
`src/instrumentation-node.ts`. It is on in production and off elsewhere;
`SITEMAP_SCHEDULER=on|off` overrides. It assumes a single instance (the
current PM2 setup); with several instances, run the job on one of them and
share `.cache/sitemaps/` or point the others at it with `SITEMAP_STORE_DIR`.

Until the first run finishes the routes answer `503 Retry-After: 300`.

## URL validation

Every run validates URLs before writing them (`src/lib/sitemap/validate.ts`):

- must answer `200` with HTML — redirects are not followed and count as failures;
- must not carry `noindex` (`X-Robots-Tag` or `<meta name="robots">`);
- must not declare a `rel=canonical` pointing elsewhere;
- article and video pages must carry a canonical to themselves (the site
  renders "not found" states with a 200, so this is the soft-404 check);
- must not match a `Disallow` rule in `robots.txt` (rules are shared with
  `app/robots.ts` through `src/lib/sitemap/robotsRules.ts`).

Fetching 57,000 article pages on every publish is not viable, so checks are
budgeted (`SITEMAP_VALIDATE_BUDGET`, default 300 per run) and cached
(`validation.json`): pages/categories/videos/authors are re-checked weekly,
articles monthly or whenever their `modified` time changes, and new articles
are checked first. Articles not yet fetched are still listed because they are
published in WordPress and their route is deterministic; set
`SITEMAP_INCLUDE_UNVALIDATED=false` to hold them back until checked.

Failed URLs are excluded, logged at error level, written to
`.cache/sitemaps/validation-report.json`, and POSTed to
`SITEMAP_ALERT_WEBHOOK_URL` (JSON `{text, summary}`, Slack-compatible) when
set. If more than half of a run's checks fail at the transport level (network
errors, 5xx, 429, 403), or more than 90% fail for any reason, the run is
treated as an outage of the checker or the site and no verdicts are recorded.

**Mass-exclusion guard:** if every URL in a previously non-trivial collection
(10+ entries — pages, categories, one article chunk's worth, videos, or
authors) fails validation in the same run, that is treated as systemic (a bad
canonical shipped live, a WAF rule, a validator bug) rather than each page
being individually gone, and the whole collection is kept in the sitemap for
that run instead of being emptied. Guarded URLs are still logged, alerted, and
listed in the validation report — marked `guarded: true` — so the underlying
problem is visible without a sitemap file silently going to zero URLs.

## Author archives

`src/data/authorAliases.ts` maps duplicate byline slugs (typos, `-2` suffixes,
honorifics, swapped name order) to a canonical slug. Alias URLs redirect with
301, the canonical page lists articles from every byline in the group, and
only the canonical slug appears in `sitemap-authors.xml`. Authors with fewer
than `SITEMAP_MIN_AUTHOR_POSTS` (5) articles are left out entirely.

Regenerate the map and `docs/author-merge-report.md` after cleaning up terms in
WordPress:

```bash
yarn sitemap audit-authors --write
```

## CLI

```bash
yarn sitemap status                       # what is on disk, last run, exclusions
yarn sitemap generate                     # incremental sync, validate, write
yarn sitemap generate --full              # re-read every article
yarn sitemap validate --budget 5000       # spend a bigger validation budget
yarn sitemap validate --strict            # exit 1 if anything is excluded (CI)
```

The CLI needs Node 22.18+ (it runs TypeScript directly) and reads
`.env.local` for `NEXT_PUBLIC_WORDPRESS_API_URL`. URLs are always built on
`https://en.igihe.com` (`SITEMAP_SITE_URL` overrides) — not on
`NEXT_PUBLIC_APP_URL`, which is `localhost` in development.

## Files on disk (`.cache/sitemaps/`)

| File | Purpose |
|---|---|
| `inventory.json` | Every article/video/category/byline known to the job |
| `manifest.json` | Per-file hash, URL count, lastmod; last run; validation summary |
| `validation.json` | Per-URL verdicts with timestamps |
| `validation-report.json` | Exclusions from the latest run |
| `*.xml` | The served sitemaps |
