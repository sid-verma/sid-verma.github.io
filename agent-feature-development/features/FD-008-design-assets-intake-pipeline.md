# FD-008: Design + Assets Intake Pipeline

## Objective

Set up a lightweight pipeline to continuously capture:
- inspiration websites
- font discoveries
- animation references
- reusable UI patterns

## Why this exists

- Good UI quality is usually the result of a steady intake loop.
- Without structured capture, inspiration is lost and hard to operationalize.

## Sources inspected

- https://www.awwwards.com/websites/portfolio/
- https://godly.website/
- https://www.lapa.ninja/
- https://www.typewolf.com/
- https://sweblogs.fyi/
- https://brutalist-websites.xyz/

## Touched Files

- `_data/design_inspiration.yml` (new)
- `_pages/design-inspiration.md` (new)
- `agent-feature-development/01-source-shortlist.md`

## Implementation Steps

1. Create `_data/design_inspiration.yml` schema:
   - `name`, `url`, `category`, `pattern`, `notes`, `last_reviewed`
2. Add `design-inspiration.md` page that renders grouped entries.
3. Add review tags (`adopted`, `parked`, `rejected`) for tracking.
4. Link this page from internal contributor docs.

## Starter Snippet

```yaml
- name: "Telha Clarke"
  url: "https://www.telhaclarke.com.au/"
  category: "portfolio"
  pattern: "numbered storytelling"
  notes: "Great rhythm for long-scroll case studies"
  status: "adopted"
  last_reviewed: "2026-02-19"
```

## Acceptance Checks

- Inspiration data file exists and renders on page.
- Entries are grouped by category.
- Review status is visible for each entry.
- At least 15 sources from shortlist are imported.

## References

- https://www.awwwards.com/websites/portfolio/
- https://godly.website/
- https://www.lapa.ninja/
- https://www.typewolf.com/
- https://sweblogs.fyi/
- https://brutalist-websites.xyz/

