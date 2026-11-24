# Build And Audit Guide

This repo is a Jekyll site built on Minimal Mistakes with custom LessWrong-style includes, Sass, and client-side behavior.

## Local Commands

Use the Homebrew Ruby on this machine; the system Ruby is too old for the lockfile's Bundler version.

```bash
/opt/homebrew/opt/ruby/bin/bundle exec jekyll build
/opt/homebrew/opt/ruby/bin/ruby script/site_audit.rb
/opt/homebrew/opt/ruby/bin/bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

The audit checks:

- home collection, sequence, and spotlight slugs resolve to real posts
- each `_data/sequences.yml` entry has a matching `_sequences/*.md` page
- the built Lunr store and homepage atlas delivery asset stay within budget
- parked Sass enhancement partials remain intentional
- built HTML internal links resolve inside `_site`

## Delivery Policy

- `assets/js/custom.js` is loaded through `_config.yml` `after_footer_scripts`.
- `particles.js` is lazy-loaded by `assets/js/custom.js` only when a `#particles-js` container exists.
- `_site/` is treated as generated deployment output in the current worktree; rebuild it after source changes if committed output is expected.
- The PNG atlas remains as source artwork. The delivered homepage atlas is `assets/images/home/renaissance-topic-sheet.jpg`.

## Known Non-Blocking Build Noise

The site currently builds with Sass deprecation warnings from the Minimal Mistakes/vendor Sass stack. They do not block the build, but they are the next modernization track if the project moves toward Dart Sass 3 compatibility.
