# FD-007: AI/ML Newsroom Hub

## Objective

Create a dedicated AI/ML hub page with:
- topic chip filtering
- latest updates lane
- research/product separation
- optional timeline section

## Why this exists

- AI/ML readers expect fast scanning by topic and recency.
- Current site structure can surface this better with one curated entry page.

## Sources inspected

- https://openai.com/news/
- https://huggingface.co/blog
- https://mistral.ai/news

## Touched Files

- `_pages/ai-ml-hub.md` (new)
- `_layouts/archive.html`
- `_includes/archive-single.html`
- `_data/navigation.yml`

## Implementation Steps

1. Add `ai-ml-hub.md` with `layout: archive` and intro copy.
2. Render sections by tag buckets (`research`, `product`, `tooling`, `safety`).
3. Add compact chips at top for anchor-jump filtering.
4. In each section, show latest 6 posts with metadata chips.
5. Add nav link to hub in `_data/navigation.yml`.

## Starter Snippet

```liquid
{% assign ai_posts = site.posts | where_exp: "p", "p.tags contains 'ai' or p.tags contains 'ml'" %}
{% for post in ai_posts limit: 6 %}
  {% include archive-single.html type="list" %}
{% endfor %}
```

## Acceptance Checks

- `/ai-ml-hub/` renders and is reachable from masthead.
- Posts are visibly grouped by topic tags.
- Each card exposes date + read time + tags.
- Empty tag groups fail gracefully (no blank sections).

## References

- https://openai.com/news/
- https://huggingface.co/blog
- https://mistral.ai/news

