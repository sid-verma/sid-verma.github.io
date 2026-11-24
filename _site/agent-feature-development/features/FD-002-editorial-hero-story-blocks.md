# FD-002: Editorial Hero + Story Blocks

## Objective

Upgrade homepage structure into a narrative flow with:
- cinematic hero
- numbered story sections
- richer CTA blocks
- optional media-first case panels

## Why this exists

- Current structure is theme-default and not differentiated.
- Award-winning portfolio sites use clearer story rhythm and visual pacing.

## Sources inspected

- https://www.telhaclarke.com.au/
- https://valientebrands.com/
- https://farmminerals.com/
- https://www.awwwards.com/websites/portfolio/

## Touched Files

- `_layouts/home.html`
- `_pages/home.md`
- `_includes/page__hero.html`
- `_sass/minimal-mistakes/_page.scss`
- `_sass/minimal-mistakes.scss` (import partial if added)

## Implementation Steps

1. Add a data-driven section model in `_pages/home.md` front matter (`story_blocks`).
2. Render `story_blocks` loop in `_layouts/home.html` with alternating layout classes.
3. Add section index token (`01`, `02`, `03`) and stat callouts.
4. Introduce hero CTA pair (`Primary`, `Secondary`) above fold.
5. Add responsive constraints so each story block collapses to single column on mobile.

## Starter Snippet

```yaml
# _pages/home.md (front matter)
story_blocks:
  - index: "01"
    title: "Build AI systems, not demos"
    body: "Production notes, architecture reviews, and measurable engineering outcomes."
    cta_label: "Read engineering posts"
    cta_url: "/categories/engineering/"
  - index: "02"
    title: "Design that improves readability"
    body: "UI changes focused on comprehension and scan speed."
    cta_label: "View design experiments"
    cta_url: "/tags/ui-ux/"
```

```liquid
{% for block in page.story_blocks %}
<section class="story-block story-block--{{ forloop.index | modulo: 2 }}">
  <p class="story-block__index">{{ block.index }}</p>
  <h2>{{ block.title }}</h2>
  <p>{{ block.body }}</p>
  <a class="btn btn--primary" href="{{ block.cta_url | relative_url }}">{{ block.cta_label }}</a>
</section>
{% endfor %}
```

## Acceptance Checks

- Home page has at least 3 narrative story blocks.
- Story blocks render cleanly on <= 768px screens.
- Hero includes two explicit CTAs.
- No CLS spikes from media in hero/story blocks.

## References

- https://www.telhaclarke.com.au/
- https://valientebrands.com/
- https://farmminerals.com/
- https://www.awwwards.com/websites/portfolio/

