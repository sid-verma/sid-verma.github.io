# Component Improvement Analysis And Spec

Generated: 2026-06-19

Scope: Jekyll + Minimal Mistakes personal technical blog with LessWrong-inspired navigation, homepage collections, search, reading tools, sequences, and topic archive UI. The improvement plan preserves the current visual design and interaction model unless an acceptance check explicitly says otherwise.

## Research Baseline

Highly relevant repositories and systems:

- Minimal Mistakes (`mmistakes/minimal-mistakes`, about 13.5k stars when checked): closest architectural ancestor; strong baseline for layouts, SEO, includes, Sass skins, and Jekyll theme conventions. https://github.com/mmistakes/minimal-mistakes
- Chirpy (`cotes2020/jekyll-theme-chirpy`): Jekyll technical-writing theme with dark/light mode, pinned posts, TOC, search, PWA, SEO, and performance-oriented asset tooling. https://github.com/cotes2020/jekyll-theme-chirpy
- Just the Docs (`just-the-docs/just-the-docs`): Jekyll documentation theme with built-in search, hierarchical nav, specs, and fixtures. https://github.com/just-the-docs/just-the-docs
- Material for MkDocs (`squidfunk/mkdocs-material`): strong reference for dense docs navigation, tabs, theme state, code-copy ergonomics, and search UX. https://github.com/squidfunk/mkdocs-material
- Astro Starlight (`withastro/starlight`): reference for accessible high-performance docs shells and content-first IA. https://github.com/withastro/starlight

Primary docs and articles:

- Jekyll data files and includes: use `_data` for repeatable IA and includes for reusable templates; avoid excessive include nesting when build time matters. https://jekyllrb.com/docs/datafiles/ and https://jekyllrb.com/docs/includes/
- `jekyll-include-cache`: cache stable includes, especially global nav, footer, and repeated partials. https://github.com/benbalter/jekyll-include-cache
- Pagefind and Lunr: Pagefind is a static-post-build index option; Lunr is the current client-side index engine. https://pagefind.app/docs/ and https://lunrjs.com/guides/getting_started.html
- Core Web Vitals: optimize LCP discovery/priority, minimize CLS, and reduce main-thread interaction cost. https://web.dev/articles/optimize-lcp, https://web.dev/articles/optimize-cls, https://web.dev/articles/optimize-inp
- Font loading: reduce blocking font work and set fallback behavior deliberately. https://web.dev/articles/optimize-webfont-loading
- Accessibility/API references: WAI modal dialog pattern, MDN Intersection Observer, Web Speech, Clipboard, View Transitions, prefers-reduced-motion, prefers-color-scheme, and localStorage.

Community research targets to keep watching:

- Stack Overflow threads around Jekyll/Lunr indexing, focus-trap implementation, Clipboard API fallbacks, and localStorage privacy-mode failures.
- Reddit discussions in `r/Jekyll`, `r/webdev`, and static-site-generator communities comparing Lunr, Pagefind, Algolia, and client-only search tradeoffs.
- Blog guides from web.dev, CSS-Tricks, Smashing Magazine, and theme maintainers for motion, dark mode, code-copy controls, and content-heavy archive IA.

## Themes And Components

### Theme 1: Site Shell And Navigation

1. Global shell layout (`_layouts/default.html`, `_sass/minimal-mistakes/_lw-layout.scss`)
   - Current: three-column responsive grid with sticky left/right rails.
   - Risks: mobile drawer lacks backdrop/inert behavior; sticky offsets are duplicated with header assumptions.
   - Spec: define shell invariants, centralize header offset as CSS custom property, add keyboard/outside-click close behavior for drawer, and avoid layout shifts by keeping fixed column min/max stable.
   - Acceptance: no visible layout change at desktop; mobile drawer opens/closes with click, Escape, and link activation.

2. Header and brand bar (`_includes/lw-header.html`, `_sass/minimal-mistakes/_lw-nav.scss`)
   - Current: brand, subtitle, nav toggle, search toggle, theme toggle.
   - Risks: button state is not fully announced; theme toggle state is ambiguous.
   - Spec: keep icon-only visual UI, add `aria-expanded`/`aria-pressed`, update labels dynamically, preserve focus ring.
   - Acceptance: Lighthouse/accessibility tooling sees buttons with state and names.

3. Left navigation (`_includes/lw-left-nav.html`)
   - Current: data-driven primary and sidebar links.
   - Risks: active matching can mark `/` too broadly if future routes shift; child links lack active state.
   - Spec: add `aria-current="page"` for active links and optionally active child matching.
   - Acceptance: current page is announced without changing style.

4. Right rail (`_includes/lw-right-rail.html`)
   - Current: recent posts and pinned links.
   - Risks: repeated site-wide rendering and no cache on stable blocks.
   - Spec: use include caching where content is stable enough; keep content ordered and data-driven.
   - Acceptance: generated HTML same shape; build work is not increased.

5. Footer (`_includes/footer.html`, `_sass/minimal-mistakes/_footer-enhanced.scss`)
   - Current: Minimal Mistakes footer plus optional enhanced styling file not imported.
   - Risks: unimported partials create dead code and unclear design ownership.
   - Spec: either import intentionally after visual review or archive/remove in a later cleanup. Preserve UI until then.
   - Acceptance: no stray enhancement partials without a documented owner.

### Theme 2: Homepage Discovery

6. Best-of hero (`_includes/lw-home-bestof.html`)
   - Current: editorial intro and collection tabs.
   - Risks: tab buttons do not expose selected state beyond class.
   - Spec: add `aria-pressed` or tab roles, keep horizontal scroll, and synchronize hash state.
   - Acceptance: tab state is screen-reader-visible.

7. Best-of collection panels (`_includes/lw-home-collection.html`, `_sass/minimal-mistakes/_lw-bestof-home.scss`)
   - Current: six scroll-snap atlas panels over one sprite image.
   - Risks: background sprite may be LCP-heavy; hover transform can conflict with reduced motion.
   - Spec: preload/compress hero image, add reduced-motion guard, keep panel dimensions stable.
   - Acceptance: same visual layout; motion stops under `prefers-reduced-motion`.

8. Best-of tiles (`_includes/lw-home-tile.html`)
   - Current: title-only links generated from post slugs.
   - Risks: silent failures when a slug is missing.
   - Spec: keep visual output, add optional build-time audit script or Liquid comment for missing posts.
   - Acceptance: no missing collection items in built homepage.

9. Homepage feed tabs (`_layouts/home.html`)
   - Current: visible `Recent`, `Sequences`, `Recommended` controls; only tag filter/load more changes content.
   - Risks: nonfunctional controls confuse assistive users and future maintainers.
   - Spec: either implement filtering semantics or mark as presentational until implemented. Best next step: wire data attributes and `aria-pressed` without visual change, then implement real feed modes later.
   - Acceptance: controls do not claim unavailable behavior.

10. Tag filter chips (`_layouts/home.html`, `assets/js/custom.js`)
    - Current: filters visible posts by tag slug.
    - Risks: string `indexOf` can false-match partial tags; active state lacks ARIA.
    - Spec: tokenize tags, use exact tag matching, update `aria-pressed`, reset load limit per filter.
    - Acceptance: `llm` does not match a larger accidental token; selected filter is announced.

11. Load more (`_layouts/home.html`, `assets/js/custom.js`)
    - Current: increases visible rows by 12.
    - Risks: button hidden state is purely visual; no result count announcement.
    - Spec: set `aria-live` count only if it can be done unobtrusively; keep current button text.
    - Acceptance: no layout shift; hidden state follows available results.

### Theme 3: Reading Experience

12. Post layout (`_layouts/single.html`, `_sass/minimal-mistakes/_lw-post.scss`)
    - Current: title, metadata, tags, reader, sequence nav, TOC, content.
    - Risks: sequence nav appears twice; this may be intentional top/bottom navigation but should be documented.
    - Spec: keep both positions if desired, but parameterize top/bottom labels later.
    - Acceptance: no duplicate landmark confusion.

13. Reading progress (`_includes/reading-progress.html`, `assets/js/custom.js`)
    - Current: inline-styled fixed gradient bar updated on every scroll event.
    - Risks: scroll handler writes style on every event; division by zero on short pages.
    - Spec: batch updates with `requestAnimationFrame`, use passive scroll listener, guard short documents.
    - Acceptance: same bar appearance; lower scroll work.

14. Speech reader (`_includes/lw-reader.html`, `assets/js/custom.js`)
    - Current: Web Speech chunks post text and reads sequentially.
    - Risks: rate change restarts current chunk awkwardly; status can be stale after errors; browser support varies.
    - Spec: robust support checks, graceful unavailable state, chunk collection scoped to article content, clean cancellation.
    - Acceptance: unsupported browsers do not throw; unload cancels speech.

15. Sequence navigation (`_includes/lw-sequence-nav.html`, `_data/sequences.yml`)
    - Current: maps current post slug to prior/next.
    - Risks: negative array access can rely on Liquid quirks; missing slugs fail silently.
    - Spec: guard previous lookup only when `current_position > 0`, add data audit for slugs.
    - Acceptance: first sequence post never renders an accidental previous link.

16. Table of contents (`_layouts/single.html`, `_sass/minimal-mistakes/_toc-enhanced.scss`, `assets/js/custom.js`)
    - Current: Minimal Mistakes TOC with Intersection Observer scroll-spy.
    - Risks: no fallback if Intersection Observer is missing; duplicate `.toc` styles may compete.
    - Spec: progressive enhancement only; if observer is unavailable, leave default links untouched.
    - Acceptance: current active behavior remains; no JS error in older browsers.

17. Code-copy controls (`assets/js/custom.js`)
    - Current: JS injects inline-styled buttons and uses Clipboard API.
    - Risks: inline styling is hard to theme; Clipboard API may fail outside secure contexts.
    - Spec: move styling to Sass later, add fallback using temporary textarea now.
    - Acceptance: copy works or fails silently without breaking code blocks.

### Theme 4: Search, IA, And Archives

18. Search overlay (`_includes/lw-search-overlay.html`, `_includes/search/search_form.html`, `assets/js/custom.js`)
    - Current: global dialog wrapping Minimal Mistakes search form.
    - Risks: modal lacks focus trap; search input has `tabindex=-1`; body scroll is manually toggled.
    - Spec: follow WAI modal pattern: focus enters dialog, Tab stays inside, Escape closes, focus returns to trigger.
    - Acceptance: keyboard-only users cannot tab behind the overlay.

19. Lunr index (`assets/js/lunr/lunr-store.js`, `_config.yml`)
    - Current: `search_full_content: true`, generated JS store for all searchable docs.
    - Risks: index payload grows quickly; all pages load search scripts because global overlay is present.
    - Spec: short-term keep Lunr but lazy-open work minimal; medium-term evaluate Pagefind as post-build index with chunks and filters.
    - Acceptance: search remains functional; payload size tracked per build.

20. Posts archive (`_layouts/posts.html`)
    - Current: year index and post rows.
    - Risks: repeated include work for all posts; no client-side filter.
    - Spec: keep server-rendered list; optionally include cached row only if parameters are stable. Avoid client hydration.
    - Acceptance: archive remains crawlable and fast.

21. Tags archive (`_layouts/tags.html`)
    - Current: tag chips sorted by count and sections by tag.
    - Risks: duplicate row rendering can be large with many tags.
    - Spec: accept for current scale; later add build audit for tag cardinality and hidden posts.
    - Acceptance: generated page remains static and searchable.

22. Topic sequences index/pages (`_pages/sequences.md`, `_includes/sequence-page.html`)
    - Current: data-driven curated reading paths.
    - Risks: data and page slugs can drift.
    - Spec: add a validator script later to check every sequence slug resolves.
    - Acceptance: validator fails CI on missing sequence posts.

### Theme 5: Theming, Motion, And Assets

23. Theme tokens (`_includes/head/custom.html`, `_sass/minimal-mistakes/skins/_lesswrong-hybrid.scss`)
    - Current: CSS custom properties in head plus skin Sass.
    - Risks: duplicate token sources; localStorage can throw in private/restricted modes.
    - Spec: keep inline flash-free init but wrap storage access, derive default from `prefers-color-scheme`, and keep Sass tokens as fallback.
    - Acceptance: no JS exception if storage is unavailable.

24. Font system (`_includes/head/custom.html`, `_sass/minimal-mistakes/_variables.scss`)
    - Current: Google Fonts preconnect and `display=swap`.
    - Risks: three remote families add render-blocking pressure.
    - Spec: preserve typography; later self-host selected WOFF2 subsets or reduce weights. Keep `display=swap`.
    - Acceptance: same fonts if online; fallback acceptable offline.

25. Motion/particles (`_includes/particles-hero.html`, `assets/js/custom.js`, `_sass/minimal-mistakes/_animations.scss`)
    - Current: particles init if global exists and hero node exists.
    - Risks: no reduced-motion skip; source library is not loaded by default in visible files.
    - Spec: skip animation under reduced motion, guard missing globals, and keep hero static.
    - Acceptance: no console errors; no particles for reduced-motion users.

26. Decorative and generated assets (`assets/images/home/renaissance-topic-sheet.png`, `assets/diagrams/*.drawio`)
    - Current: sprite-backed home atlas plus Draw.io diagrams.
    - Risks: image compression and dimensions unknown; Draw.io source workflow undocumented outside guide files.
    - Spec: add image metadata audit, compression workflow, and explicit dimensions where images enter markup.
    - Acceptance: no CLS from image assets; hero asset under budget.

### Theme 6: Build, Quality, And Delivery

27. JavaScript bundle (`package.json`, `assets/js/_main.js`, `assets/js/custom.js`, `assets/js/main.min.js`)
    - Current: `build:js` only minifies vendor/theme JS into `main.min.js`; custom JS is separate and not included in `scripts.html` unless configured elsewhere.
    - Risks: custom JS may be missing from built pages unless configured through footer scripts; minified bundle can drift from sources.
    - Spec: make script ownership explicit: either add `assets/js/custom.js` to `after_footer_scripts` or include it directly in `scripts.html`; update build pipeline to generate both or document manual loading.
    - Acceptance: current custom interactions load on the deployed site.

28. Sass partial ownership (`_sass/minimal-mistakes.scss`)
    - Current: several new partials are imported; some enhancement partials are not.
    - Risks: dead styles and accidental future imports can change UI.
    - Spec: maintain an import manifest and only import reviewed partials.
    - Acceptance: `rg` shows no orphaned enhancement partial without a note.

29. Jekyll config and plugins (`_config.yml`, `Gemfile`)
    - Current: `jekyll-drawio`, include cache, sitemap/feed/paginate/gist.
    - Risks: GitHub Pages compatibility if custom plugins are required; build environment must match.
    - Spec: document deployment target and whether custom plugin builds happen in CI before publishing `_site`.
    - Acceptance: build command succeeds locally and in target CI.

30. Generated output (`_site/`)
    - Current: generated files are tracked/dirty.
    - Risks: source and built output can diverge; diffs are noisy.
    - Spec: decide whether `_site` is committed as deployment artifact; if yes, always rebuild after source changes. If no, ignore it.
    - Acceptance: repo policy is documented and followed.

## Sequential Orchestration Plan

1. Stabilize runtime behavior: focus trap, safe storage, exact filters, passive/rAF scroll, Clipboard fallback, reduced-motion guards.
2. Add validation scripts: sequence slug audit, home collection slug audit, asset budget report, search store size report.
3. Clarify delivery pipeline: load custom JS explicitly, rebuild minified assets, decide `_site` policy.
4. Optimize payloads: compress atlas asset, evaluate Pagefind migration, consider search-on-demand loading.
5. Consolidate tokens/styles: move inline copy-button styles into Sass, centralize CSS variables, review orphan partials.
6. Broaden verification: local Jekyll build, link checks, keyboard walkthrough, mobile/desktop screenshot checks, Lighthouse/WebPageTest audit.

## First Implementation Slice

The safest immediate improvements are in `assets/js/custom.js` and `_includes/theme-toggle.html`:

- Preserve all UI classes and layout.
- Add graceful failure paths and ARIA state.
- Reduce scroll and animation cost.
- Improve keyboard accessibility for modal/drawer controls.
- Avoid dependency or build-system changes until the script-loading policy is confirmed.

## Implementation Status

Completed in the current workspace:

- Runtime stabilization: focus trap, safe theme storage, exact tag filters, passive/rAF reading progress, Clipboard fallback, reduced-motion guards, ARIA state, and TOC fallback.
- Delivery pipeline: `assets/js/custom.js` is loaded explicitly through `_config.yml`; particles are lazy-loaded only when needed.
- Asset optimization: the homepage atlas now uses a 733 KB JPEG delivery asset while preserving the original PNG source.
- Validation: `script/site_audit.rb` checks curated slugs, sequence pages, payload budgets, Sass partial ownership, image dimensions, and built internal links.
- Content integrity: old dated internal post links were migrated to the active `/posts/:slug/` permalink scheme, and `/categories/` now has an archive page.
- Operations: `BUILD_AND_AUDIT.md` documents build, audit, preview, deployment-output, and known Sass warning policy.

Deferred by design:

- Full Sass `@import`/vendor migration remains deferred because it is broad framework modernization and would touch the Minimal Mistakes/vendor stack.
- Parked enhancement partials remain unimported because importing them would visibly change the current UI.
