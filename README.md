# SNN Block

SNN Block is a standalone WordPress block theme with the SNN feature set. It is forked from `snn-brx-child-theme` with every Bricks Builder feature removed.

## What is included

- **Settings dashboard** (SNN Settings) with one switch per feature, under *Customizations*.
- **Security:** login protection, math captcha, Turnstile, XML-RPC and file-editing off, WP JSON limits, and more.
- **Content:** post types, custom fields, taxonomies, dashboard widgets, draft revisions.
- **Mail:** SMTP settings, mail customizer and mail logs.
- **Logs:** 404 logs, search logs, activity log, 301 redirects.
- **Media:** file-size column, image optimization, SVG upload (blocked unless a sanitizer library is installed).
- **SEO** settings and an AI SEO generator.
- **Privacy:** cookie banner and script blocker, accessibility widget.
- **Interactions:** GSAP, ScrollTrigger, Lenis smooth scroll and page transitions, with `data-animate` attributes for plain HTML.
- **AI:** AI settings, block-editor AI, AI chat agent, WordPress abilities, and a built-in MCP server for AI assistants (read and write access per group, with named tokens).
- **Code snippets** and role manager.

## What was removed

All code that depends on Bricks Builder: the page elements, dynamic data tags, query loops, the Bricks AI chat and its builder compiler, the Bricks editor panels, the Bricks SEO setting, the builder overlay, the GitHub auto-update of `snn-brx-child-theme`, and the GitHub release and sync workflows.

## Requirements

- WordPress 6.9 or newer.
- No parent theme. The theme ships one minimal `index` template and an empty `theme.json`.
- PHP 8.2 (the version used for testing).

## Development

The theme is developed next to a local WordPress test site (`blocks.local`), where the theme folder is linked into `wp-content/themes/`.

## Credits and license

Based on snn-brx-child-theme by sinanisler. Licensed under the GNU General Public License v3 (see `license.txt`).
