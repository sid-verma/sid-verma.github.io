# FD-003: Typography + Variable Font System

## Objective

Replace ad-hoc font loading with a performance-aware typography system:
- variable font support
- preloading strategy
- fallback stacks
- consistent editorial scale

## Why this exists

- Typography is central to technical blogs.
- Current setup imports Google Fonts directly and can be tightened for performance and consistency.

## Sources inspected

- https://www.typewolf.com/
- https://web.dev/articles/optimize-webfont-loading
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide
- https://fontshare.com/

## Touched Files

- `_includes/head/custom.html`
- `_sass/minimal-mistakes/_variables.scss`
- `_sass/minimal-mistakes/_base.scss`
- `assets/fonts/` (new local assets if self-hosted)

## Implementation Steps

1. Select one variable sans + one mono family.
2. Self-host font files in `assets/fonts/`.
3. Add `@font-face` with `font-display: swap` and axis ranges.
4. Preload only critical above-the-fold font files.
5. Update SCSS variables (`$sans-serif`, `$monospace`) to new stack.
6. Validate no flash/shift regressions on first paint.

## Starter Snippet

```css
@font-face {
  font-family: "SatoshiVar";
  src: url("/assets/fonts/Satoshi-Variable.woff2") format("woff2-variations");
  font-weight: 300 900;
  font-display: swap;
}

:root {
  --font-sans: "SatoshiVar", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

## Acceptance Checks

- Lighthouse shows no new font-related blocking regressions.
- Body/headings/code use the intended stacks.
- Fallback fonts render correctly if webfont fails to load.
- Font files are served from local `assets/fonts/` if self-host strategy is used.

## References

- https://www.typewolf.com/
- https://web.dev/articles/optimize-webfont-loading
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide
- https://fontshare.com/

