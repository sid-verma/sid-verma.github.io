# Website refinement: audit and implementation plan

Status: source audit completed; rendered comparison and implementation pending.

This plan builds on the existing working tree. No application files have been changed during this planning step. The reference is https://www.lesswrong.com/, whose desktop homepage was inspected during this task. Its article pages, mobile states, exact font metrics, and transition timings have not yet been verified. Proposed design targets below are recommendations, not measurements of LessWrong.

## Comparison baseline

The observed LessWrong homepage uses a restrained header, narrow icon navigation, a prominent illustrated editorial selection, serif post titles, sans-serif metadata, muted surfaces, and compact post rows. This site already uses serif/sans-serif roles and illustrated selections, but devotes more space to navigation, collection artwork, excerpts, and tags before a visitor reaches recent writing.

The font stack is Libertinus Serif for prose and titles, Source Sans 3 for interface text, and JetBrains Mono for code. All three are requested through Google Fonts with display=swap. No local font files exist. Remote delivery is not itself a defect; actual loading, fallback layout shift, italic coverage, and weight matching need browser verification. A named Freight Sans Pro fallback does not establish that this font is delivered.

## Confirmed source findings and planned fixes

| Priority | Finding and evidence | Files | Planned outcome and acceptance check |
|---|---|---|---|
| P1 | Recent, Sequences, and Recommended feed buttons have no event handlers or destinations. | `_layouts/home.html`, `assets/js/custom.js` | Every visible control performs its named action. Use real sequence navigation and explicitly curated recommendations, or remove unsupported modes. Verify by mouse and keyboard. |
| P1 | `join: ' ' \| slugify` converts multiple tags into one hyphenated string, but filtering splits on whitespace and expects individual tags. | `_includes/lw-post-row.html`, `assets/js/custom.js` | Serialize each normalized tag separately. A post with multiple tags must match each relevant filter. Include an accessible zero-result state. |
| P1 | Homepage uses only `paginator.posts`; Load More only reveals rows already in the DOM, with no pagination links in the layout. | `_layouts/home.html`, `assets/js/custom.js` | Visitors can reach every published post from the feed or an explicit archive destination. Filtering must state its scope and must not silently imply a complete-site search. |
| P1 | Closed mobile navigation uses only a transform; links remain focusable and exposed to assistive technology. | `_sass/minimal-mistakes/_lw-layout.scss`, `_includes/lw-left-nav.html`, `assets/js/custom.js` | Closed drawer is excluded from keyboard traversal. Opening, Escape, closing, focus restoration, and crossing the desktop breakpoint all preserve coherent state. |
| P1 | `--lw-bg-hover` and `--lw-tag-ai` are used without definitions. | `_sass/minimal-mistakes/_lw-feed.scss`, `_sass/minimal-mistakes/_lw-nav.scss`, `_includes/head/custom.html` | Define shared semantic colors or use existing tokens. Confirm visible hover and active states in both themes. |
| P1 | Karma values are calculated from title/content length rather than visitor feedback. | `_includes/lw-post-row.html` | Replace with useful factual metadata, such as reading time. No generated engagement scores. |
| P2 | Collection tabs always request smooth scrolling, including under reduced-motion preferences. Collection hash initialization selects a tab without moving the horizontal catalog. | `assets/js/custom.js`, `_sass/minimal-mistakes/_lw-bestof-home.scss` | Reduced motion uses immediate movement. Direct collection links select and reveal the intended collection. Manual scrolling keeps selection consistent. Validate observer behavior when the catalog becomes a vertical grid. |
| P2 | Search switches display directly, producing no entry/exit transition; existing focus trap and Escape handling are already present. | `_sass/minimal-mistakes/_lw-search.scss`, `_includes/lw-search-overlay.html`, `assets/js/custom.js` | Introduce a short opacity transition with safe hidden/focus state, readable surfaces, and result announcements. Preserve the working trap and focus restoration. Verify empty query, no matches, results, and repeated open/close. |
| P2 | Theme colors are spread between inline head CSS and Sass; several controls remove outlines and rely on border/color changes. | `_includes/head/custom.html`, `_sass/minimal-mistakes/_lw*.scss` | Centralize semantic theme and motion tokens. Give all interactive components a distinct focus-visible indicator. Verify contrast before approving colors. |
| P2 | Mobile layout stacks all illustrated collections before recent posts; desktop collection panels have a 620px minimum width and 36rem minimum height. | `_layouts/home.html`, `_includes/lw-home-bestof.html`, `_sass/minimal-mistakes/_lw-bestof-home.scss` | Preserve artwork while reducing the distance to recent writing. Choose compact featured selection or progressive disclosure after measuring current layouts. Avoid document-level horizontal overflow. |
| P2 | Main shell reserves 180–220px for navigation and 220–280px for the right rail, with two 2rem gaps. | `_sass/minimal-mistakes/_lw-layout.scss`, `_sass/minimal-mistakes/_lw-nav.scss` | Measure usable reading width near 1200px. Allocate more space to content and keep sticky rails clear of article contents navigation. |
| P2 | Speech collection selects both containers and descendants, e.g. blockquotes and their paragraphs or nested list items, which can duplicate text. Playback label changes do not update the fixed accessible name. | `assets/js/custom.js`, `_includes/lw-reader.html` | Speak text once in document order and exclude navigation. Accessible names reflect play/pause/resume state. Check cancellation and rate-change callbacks against stale utterances. |
| P2 | Copy code derives text from the entire pre element after inserting a button; it removes button labels only with a line-based regex and silently ignores failure. | `assets/js/custom.js`, `_sass/minimal-mistakes/_lw-post.scss` | Copy the code node only, preserving whitespace. Announce success/failure and make the control discoverable on touch devices. Verify exact copied text, including code without a final newline. |
| P2 | Reading progress uses the entire document, including rails and footer, rather than article bounds. | `assets/js/custom.js`, `_includes/reading-progress.html` | Progress represents article reading and updates after resize/content geometry changes. Verify beginning and end on short and long posts. |
| P3 | Atlas background URL is root-relative while image preload uses relative_url; nonempty baseurl deployments can diverge. | `_sass/minimal-mistakes/_lw-bestof-home.scss`, `assets/css/main.scss` | Resolve artwork consistently through deployment configuration. Verify if subpath hosting is supported. |

## Implementation ownership and sequence

1. Finish rendered baseline: homepage, all-posts archive, sequences, tags, about, and representative articles containing code, tables, lists, diagrams, and a table of contents. Inspect LessWrong article and mobile interactions. Record viewport, theme, loaded fonts, overflow, and screenshots.
2. Freeze shared contracts before dispatch: theme/motion token names, drawer state attributes, feed modes, collection behavior, and semantic metadata.
3. Agent A owns layout and typography: `_lw-layout.scss`, `_lw-nav.scss`, `_lw-post.scss`, font declarations, and shared theme styles. Establish readable measure, responsive hierarchy, and focus styling.
4. Agent B owns JavaScript behavior: `assets/js/custom.js`, reader/search/navigation markup, and `_lw-search.scss`. Fix filtering, drawer state, search, reduced motion, reader, copy, and progress behavior. Coordinate feed markup with Agent C before edits.
5. Agent C owns discovery components: homepage layout, collection and post-row includes, `_lw-feed.scss`, and `_lw-bestof-home.scss`. Fix metadata, browsing completeness, functional feed controls, and mobile collection density.
6. Primary agent integrates shared files and reviews all changes against the dirty-tree baseline, runs build/audit, and verifies the rendered site. Agents must not rebuild generated output concurrently or modify each other's owned files.

## Design acceptance targets

- Clear serif title/prose and sans-serif interface hierarchy, with delivered weights and italics verified; fallback fonts remain readable.
- Article measure approximately 60–75 characters where space permits; final values chosen from rendered examples.
- No document-level horizontal overflow at 360, 390, 768, 1024, 1280, and 1440px; code and wide tables may scroll within their own containers.
- Keyboard-visible focus, coherent selected/expanded states, and practical touch targets throughout.
- Short, consistent transitions, initially 120–180ms for feedback and 180–220ms for overlays/drawers; these are proposed values, not measured LessWrong timings.
- Reduced motion disables spatial animation and forced smooth scrolling. No decorative continuous movement is necessary for the observed reference's hierarchy.
- Preserve article content and existing illustration identity while refining presentation.

## Verification completed in this planning step

`/opt/homebrew/opt/ruby/bin/ruby script/site_audit.rb` passed with zero warnings against existing generated output. It reported a 491.4KB built search store and a 732.8KB homepage JPEG at 1536×1024. This was not a fresh build and does not validate interaction behavior or rendered layout.

## Completion gate

The component-level specification in [WEBSITE_TEST_SPEC.md](WEBSITE_TEST_SPEC.md) is mandatory for implementation. Agents must map their changes to its test IDs and report evidence, failures, and untested cases. A CSS declaration or successful build alone does not establish that a component or animation works.

Planning is ready for dispatch only after the rendered baseline and remaining reference inspection resolve layout choices. Implementation completes after a fresh Jekyll build, site audit, representative-page visual review, and browser checks of feed filters/pagination, search, drawer, collection navigation, themes, keyboard focus, reduced motion, copy, and article controls. Record any remaining reference differences explicitly; do not claim pixel equivalence or verified transition timing without measurements.
