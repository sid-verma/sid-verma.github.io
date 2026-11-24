# Capability Catalog -> Repo Feature Opportunities

This file maps observed capabilities to concrete files in this repository.

## 1) Cinematic hero and story sequencing

- Capability observed:
  - Preloader + bold hero + numbered content progression.
- Inspiration:
  - https://www.telhaclarke.com.au/
  - https://valientebrands.com/
- Repo migration targets:
  - `_layouts/home.html`
  - `_pages/home.md`
  - `_includes/page__hero.html`
  - `_sass/minimal-mistakes/_page.scss`

## 2) Dense, readable engineering feed

- Capability observed:
  - Text-first archive with strong title/date/excerpt balance.
- Inspiration:
  - https://overreacted.io/
  - https://shopify.engineering/
- Repo migration targets:
  - `_includes/archive-single.html`
  - `_includes/page__meta.html`
  - `_sass/minimal-mistakes/_archive.scss`
  - `_sass/minimal-mistakes/_glass-cards.scss`

## 3) Command palette navigation (`Cmd/Ctrl + K`)

- Capability observed:
  - Keyboard-first navigation and search.
- Inspiration:
  - https://linear.app/now (visible `Cmd+K` entry point)
  - https://sweblogs.fyi/
- Repo migration targets:
  - `_includes/masthead.html`
  - `_includes/search/search_form.html`
  - `assets/js/custom.js`
  - `_sass/minimal-mistakes/_navigation.scss`

## 4) Motion primitives (state and layout transitions)

- Capability observed:
  - Reflow animations, staged reveals, and declarative transitions.
- Inspiration:
  - https://fantasticmotion.fyi/
  - https://motion.dev/docs/react-layout-animations
  - https://www.transition.style/
- Repo migration targets:
  - `assets/js/custom.js`
  - `_sass/minimal-mistakes/_animations.scss`
  - `_includes/head/custom.html`

## 5) Progressive view transitions + scroll-driven animations

- Capability observed:
  - Native transition API and timeline-based scroll animations.
- Inspiration:
  - https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
  - https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations
- Repo migration targets:
  - `assets/js/custom.js`
  - `_sass/minimal-mistakes/_animations.scss`

## 6) Typography system with variable fonts

- Capability observed:
  - Intentional font pairings + performance-aware font delivery.
- Inspiration:
  - https://www.typewolf.com/
  - https://web.dev/articles/optimize-webfont-loading
  - https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide
  - https://fontshare.com/
- Repo migration targets:
  - `_includes/head/custom.html`
  - `_sass/minimal-mistakes/_variables.scss`
  - `_sass/minimal-mistakes/_base.scss`
  - `assets/fonts/` (new)

## 7) AI/ML newsroom information architecture

- Capability observed:
  - Topic chips (`Product`, `Research`), date-forward cards, frequent updates.
- Inspiration:
  - https://openai.com/news/
  - https://huggingface.co/blog
  - https://mistral.ai/news
- Repo migration targets:
  - `_pages/` (new hub page)
  - `_layouts/archive.html`
  - `_includes/archive-single.html`
  - `_data/navigation.yml`

## 8) Inspiration and assets intake loop

- Capability observed:
  - Constant discovery channels for UI assets, themes, and fonts.
- Inspiration:
  - https://www.awwwards.com/websites/portfolio/
  - https://godly.website/
  - https://www.lapa.ninja/
  - https://sweblogs.fyi/
- Repo migration targets:
  - `_data/` (new `design_inspiration.yml`)
  - `_pages/` (new inspiration page)
  - `agent-feature-development/` docs for maintenance workflow

