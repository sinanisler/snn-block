# Static Deploy (SNN feature)

A simplified version of the free features of Simply Static 3.8.24 (`D:\WWW\simply-static.3.8.24`), built into the theme. It turns the WordPress site into plain HTML, CSS, JavaScript and image files, then delivers them as a ZIP download or copies them to a local folder.

Settings screen: **SNN Settings > Static Deploy** (feature slug `snn-static-deploy`, switch it off under Customizations).

## Files

| File | Role |
|---|---|
| `includes/features/static-deploy.php` | Entry: menu, REST routes, admin assets, ZIP download, WP-Cron continuation |
| `includes/features/static-deploy/class-sd-options.php` | Settings, defaults, sanitising |
| `includes/features/static-deploy/class-sd-url.php` | URL rules: site membership, file names, links, exclusions, disk paths |
| `includes/features/static-deploy/class-sd-pages.php` | The page table (queue and log in one) |
| `includes/features/static-deploy/class-sd-crawler.php` | Finds URLs in WordPress (posts, archives, terms, authors, dates, pagination, sitemap, robots, feeds, extra URLs and files) |
| `includes/features/static-deploy/class-sd-fetcher.php` | Fetches one URL, saves it, handles redirects and retries |
| `includes/features/static-deploy/class-sd-rewriter.php` | Rewrites links in HTML, CSS, scripts, XML and text, and reports the local URLs it finds |
| `includes/features/static-deploy/class-sd-exporter.php` | The job: discover, fetch, 404, deliver, wrap up; pause, resume, cancel, lock |
| `includes/features/static-deploy/class-sd-delivery.php` | ZIP in batches, local copy in batches, safety checks on the destination |
| `includes/features/static-deploy/class-sd-settings-page.php` | The screen: export controls, settings form, page log |
| `includes/features/static-deploy/static-deploy-admin.js` and `.css` | Progress, steps, log on the screen |

## How an export runs

1. **discover**: crawlers list the URLs (in chunks, with a cursor).
2. **fetch**: pending URLs are fetched in batches. A local asset on disk is copied without a request. Redirects to the same page are followed; other redirects get a redirect page. 5xx, 408, 425 and 429 are retried up to three times. Links found inside saved pages are queued.
3. **not_found**: `404.html` from the custom 404 page, or from an address that does not exist. Assets it links to are fetched afterwards.
4. **deliver**: the files are added to the ZIP, or copied to the local folder, in batches.
5. **wrapup**: the working files are removed; the job is done.

A step runs for a time budget (default 8 seconds, 10 pages). The admin page calls the step again until the export ends. When the page is closed, WP-Cron continues the job. A lock stops two steps running at once. A running job with no update for five minutes is taken over by a new export.

## Links

Every link to the site is rewritten into one of three styles:

- **Relative to the site root**: `/about/`
- **Absolute**: `https://host/about/`
- **Offline**: `../../about/index.html`, so the folder works from disk.

File names and links come from the same function, so they always agree. Non-ASCII slugs are transliterated (`ğüş` becomes `gus`). Query strings go to a `__qs/<hash>/` folder. Feeds become `feed/index.xml`. Feed autodiscovery `<link>` tags in the head are removed from every page, so per-post feeds are not exported; the site feed is exported when feeds are on.

Smart crawl (on by default): pages come from the crawlers, and links inside content only add files (images, CSS, JS, fonts, PDFs). Off: every local link is followed.

Term archives are listed only for terms with published posts (`hide_empty`). An empty category still opens on WordPress, but it has nothing to export.

The home page must be saved. If it cannot be fetched or written, the export stops with a message that names the home page, so an export never ends up as an empty site.

## Taken from Simply Static (read in full)

Boot and task list, the archive job (setup, discover, fetch, 404, deliver, wrapup, cancel), the page table and its states, crawler stages, the URL extractor's tag map and its CSS, script and JSON rules, the three destination types, the 404 handling, the redirect rules, the local-folder safety checks, and the robots.txt, llms.txt, `_redirects` and `_headers` treatment.

## Not included (Pro or out of scope for this version)

Deploy targets (GitHub, Netlify, Cloudflare, S3, BunnyCDN, SFTP), incremental and single-page exports, WP-CLI, forms, search (Fuse, Algolia), minification, CSS/JS optimisation, image optimisation, comments, multilingual crawlers, page builder crawlers (Elementor, Divi, Beaver Builder), Yoast/Rank Math sitemap handlers, the activity log in the Simply Static format, and the Simply Static UI.

Known limits: ZIP delivery is not split across steps by size (the ZIP is written in batches of files, but each batch is capped at 200 files). Conditional comments in HTML are not rewritten. Output names are case-insensitive on Windows, so `/About/` and `/about/` collide there.

## Tests

Test scripts live in `C:\Users\sinan\.local-server\snn-block-work\tests\static-deploy\` (persistent, next to the other blocks.local tests):

| Script | What it checks |
|---|---|
| `seed-content.php` | Creates 43 published pages and posts in many styles (long prose, heading tree with anchors, nested lists, table with 60 rows, code, quotes and verse, gallery and captions, columns, group, cover, buttons, FAQ details, raw HTML with inline CSS and scripts, Turkish slug and RTL text, parent/child/grandchild pages, 25-post pagination batch, dated posts, authors) and their images |
| `unit-tests.php` | 129 checks: URL rules, file names, the three link styles, exclusions, rewriter (HTML, CSS, text, srcset, meta refresh), pages table, option sanitising, delivery safety and batching, job lifecycle (start, pause, resume, cancel) and the lock |
| `export-matrix.php` | Four full exports of the seeded site: relative with feeds (local), relative (ZIP, extracted and checked), absolute (local), offline (local). Each output is checked: every queued row has its file, every internal link and asset reference resolves, no origin host is left in links, the link style matches the destination, UTF-8 is valid |
| `http-tests.ps1` | The browser path: login, settings screen, REST auth, form save with nonce, start and step to the end, ZIP download and its listing, pause, resume, cancel, feature toggle off and on |
| `screenshots.ps1` | WordPress page against the static copy, both full-page at 1440 px with reduced motion, pixel comparison (`compare.ps1`, mismatch percent and a diff image for each page) |
| `run-all.ps1` | Everything above in order, with a summary file |

On blocks.local, PHP-CGI runs one worker, so the browser-driven export waits for its own requests and times out. `http-tests.ps1` cannot pass until the worker count is raised (the test machine setup is outside this repo). The CLI runs (unit tests, matrix) are not affected.

Run order when needed by hand: `php seed-content.php`, `php unit-tests.php`, `php export-matrix.php`, `powershell -File http-tests.ps1`, `php feature-toggle.php reset`, `powershell -File screenshots.ps1`.
