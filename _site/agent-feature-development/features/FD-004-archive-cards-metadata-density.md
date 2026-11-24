# FD-004: Archive Cards + Metadata Density

## Objective

Make post cards more informative at a glance:
- stronger title contrast
- metadata chips (date, read time, tags)
- optional category badge
- better hover/focus states

## Why this exists

- Current cards are visually improved but still lightweight in metadata density.
- Engineering readers scan by topic/date/read-time first.

## Sources inspected

- https://overreacted.io/
- https://shopify.engineering/
- https://godly.website/
- https://www.lapa.ninja/

## Touched Files

- `_includes/archive-single.html`
- `_includes/page__meta.html`
- `_sass/minimal-mistakes/_glass-cards.scss`
- `_sass/minimal-mistakes/_archive.scss`

## Implementation Steps

1. In `archive-single`, add optional category/tag chips near title.
2. In `page__meta`, expose read-time + date in compact pill format for list/grid.
3. Improve card hover/focus-visible states and keyboard focus ring.
4. Add `aria-label` context for chip links.

## Starter Snippet

```liquid
{% if post.tags and post.tags.size > 0 %}
<div class="archive__chips">
  {% for tag in post.tags limit:3 %}
    <a class="archive__chip" href="{{ '/tags/' | relative_url }}#{{ tag | slugify }}">#{{ tag }}</a>
  {% endfor %}
</div>
{% endif %}
```

```scss
.archive__chip {
  display: inline-flex;
  padding: 0.2rem 0.55rem;
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  font-size: 0.72rem;
  color: var(--text-secondary);
}
```

## Acceptance Checks

- Cards show date + read time + up to 3 tags.
- Chip links are keyboard accessible.
- Focus-visible is obvious in both dark and light themes.
- No layout breaks on mobile list mode.

## References

- https://overreacted.io/
- https://shopify.engineering/
- https://godly.website/
- https://www.lapa.ninja/

