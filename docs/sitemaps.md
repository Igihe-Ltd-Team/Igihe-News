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

Failed URLs are excluded and written to
`.cache/sitemaps/validation-report.json`. A URL that was not excluded on the
previous run is logged at error level and POSTed to `SITEMAP_ALERT_WEBHOOK_URL`
(JSON `{text, summary}`, Slack-compatible) when set; URLs that stay excluded run
after run are summarised once at info level, so the error log does not repeat
the same lines every hour.

**Outage guard.** Two checks stop a broken checker or site from emptying the
sitemap, and neither relies on how many URLs failed:

- *Transport:* if more than half of a run's checks fail with network errors,
  5xx, 429 or 403, nothing is recorded.
- *Controls:* when more than half of a batch fails (and at least 3 URLs), the
  home page and up to 3 recently verified articles are fetched. If the home page
  fails, or none of those articles pass any more, nothing is recorded. If they
  pass, the failures are real and are recorded. A failure *ratio* cannot make
  this call on its own: a retry batch of URLs already known to be bad fails
  almost 100% by construction.

**Mass-exclusion guard:** if every URL in a previously non-trivial collection
(10+ entries — pages, categories, one article chunk's worth, videos, or
authors) fails validation in the same run, that is treated as systemic (a bad
canonical shipped live, a WAF rule, a validator bug) rather than each page
being individually gone, and the whole collection is kept in the sitemap for
that run instead of being emptied. Guarded URLs are still logged, alerted, and
listed in the validation report — marked `guarded: true` — so the underlying
problem is visible without a sitemap file silently going to zero URLs.

## URL rules

- Every path segment is percent-encoded (`encodeSegment` in `build.ts`), so
  `<loc>` is always a valid URL even for slugs with accents or invisible
  characters.
- Posts are listed under their first category, except categories the app serves
  with a dedicated route. `services` is one: `/services/article/<slug>` is the
  legacy services page, whose canonical points at WordPress. Those posts are
  listed under their next category, or `/news/article/<slug>`. Add other
  segments to `RESERVED_ARTICLE_SECTIONS` in `config.ts` if more collide.

### Articles with non-ASCII slugs

A small number of articles (about 15 so far) have slugs containing accents or
invisible characters, for example `ngugĩ-wa-thiong-o-…`. WordPress returns such
a slug from its REST API, but its own `?slug=` filter never matches it back, so a
plain slug lookup finds nothing. The site resolves them in two steps:

1. `fetchPostBySlug` / `customPostFetch` (`src/services/articleService.ts`):
   when the slug lookup is empty and the slug is not plain ASCII, search for the
   slug's plain words (`slugSearchTerms` in `src/lib/slugLookup.ts`, which drops
   zero-width characters, treats odd spaces as separators and ignores numbers),
   keep only the candidate whose slug is exactly the requested one, and load it
   by ID. Plain slugs never trigger the search.
2. The article page decodes the `post` route param (`decodeSlugParam`): Next.js
   passes it percent-encoded to the page body but decoded to `generateMetadata`,
   so without this the body looked up `ngug%C4%A9-wa…` and rendered not-found
   while the metadata found the post.

These URLs are percent-encoded in the sitemap, and the validator now passes them
like any other article. If a new post ever fails to resolve, check its slug with
`slugSearchTerms`: it needs at least one plain word of 4+ letters.

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
