# FD-005: Reading Experience Upgrade

## Objective

Improve article readability and orientation:
- cleaner progress bar implementation
- stronger TOC scroll-spy
- resilient code-copy behavior
- refined long-form spacing

## Why this exists

- Existing progress/TOC/copy behavior is present but partly inline and can be hardened.
- Long-form technical posts need stronger wayfinding.

## Sources inspected

- https://overreacted.io/
- https://frontend.fyi/
- https://fantasticmotion.fyi/

## Touched Files

- `_includes/reading-progress.html`
- `_layouts/single.html`
- `assets/js/custom.js`
- `_sass/minimal-mistakes/_toc-enhanced.scss`
- `_sass/minimal-mistakes/_page.scss`

## Implementation Steps

1. Remove inline styles from `reading-progress` include and move to SCSS class.
2. Debounce scroll handler and clamp progress values.
3. Improve TOC active heading logic (single active link, section offset tuning).
4. Ensure copy-button ignores hidden button text when extracting code.
5. Add generous paragraph rhythm for long-form reading.

## Starter Snippet

```html
<!-- _includes/reading-progress.html -->
<div id="reading-progress" class="reading-progress" aria-hidden="true"></div>
```

```scss
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 3px;
  z-index: 99999;
  background: linear-gradient(90deg, #58a6ff, #79c0ff);
  transition: width 0.08s linear;
}
```

## Acceptance Checks

- Progress bar updates smoothly without jank.
- TOC highlights the currently visible heading reliably.
- Code-copy buttons work across all syntax-highlighted blocks.
- Post typography remains legible on mobile and desktop.

## References

- https://overreacted.io/
- https://frontend.fyi/
- https://fantasticmotion.fyi/

