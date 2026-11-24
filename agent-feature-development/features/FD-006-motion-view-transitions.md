# FD-006: Motion + View Transitions

## Objective

Define a coherent motion system with progressive enhancement:
- named easing/duration tokens
- optional native view transitions
- scroll-linked effects where appropriate
- reduced-motion compliance

## Why this exists

- Current animations are mixed (`AOS`, custom inline animation, hover transforms).
- A unified motion layer improves quality and maintainability.

## Sources inspected

- https://fantasticmotion.fyi/
- https://motion.dev/docs/react-layout-animations
- https://www.transition.style/
- https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations

## Touched Files

- `_sass/minimal-mistakes/_animations.scss`
- `_includes/head/custom.html`
- `assets/js/custom.js`

## Implementation Steps

1. Define motion tokens (`--dur-fast`, `--dur-base`, `--ease-standard`).
2. Replace ad-hoc timing values with tokens across masthead/cards/content.
3. Add guarded `document.startViewTransition` wrapper for same-page state changes.
4. Add `@media (prefers-reduced-motion: reduce)` overrides globally.
5. Keep transitions subtle for content-heavy reading layouts.

## Starter Snippet

```js
function runViewTransition(updateDOM) {
  if (!document.startViewTransition) {
    updateDOM();
    return;
  }
  document.startViewTransition(updateDOM);
}
```

```scss
:root {
  --dur-fast: 140ms;
  --dur-base: 260ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }
}
```

## Acceptance Checks

- Transition timing values come from tokens.
- Reduced-motion users do not receive complex motion.
- View transitions are guarded and do not break unsupported browsers.
- No large CLS/INP regressions from motion updates.

## References

- https://fantasticmotion.fyi/
- https://motion.dev/docs/react-layout-animations
- https://www.transition.style/
- https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations

