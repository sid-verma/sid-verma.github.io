# FD-001: Command Palette Navigation

## Objective

Introduce a keyboard-first command palette (`Cmd/Ctrl + K`) that opens:
- core navigation links
- search shortcut
- latest posts
- high-priority pages

## Why this exists

- Linear-style command activation is now standard for fast navigation.
- Current nav is mouse-first and hides options behind responsive menu overflow.

## Sources inspected

- https://linear.app/now
- https://sweblogs.fyi/

## Touched Files

- `_includes/masthead.html`
- `_includes/search/search_form.html`
- `assets/js/custom.js`
- `_sass/minimal-mistakes/_navigation.scss`
- `_sass/minimal-mistakes.scss` (import new partial if needed)

## Implementation Steps

1. Add hidden palette shell near end of `masthead` include.
2. Populate a JSON-like command list from:
   - `site.data.navigation.main`
   - latest 8 posts (`site.posts limit:8`)
3. Bind keyboard shortcut (`metaKey || ctrlKey`) + `k` in `assets/js/custom.js`.
4. Add fuzzy filtering for command title + tag.
5. Support full keyboard selection (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
6. Respect reduced motion and trap focus while modal is open.

## Starter Snippet

```html
<!-- _includes/masthead.html -->
<div id="command-palette" class="command-palette" hidden>
  <div class="command-palette__backdrop" data-close-palette></div>
  <div class="command-palette__panel" role="dialog" aria-modal="true" aria-label="Command palette">
    <input id="command-input" type="text" placeholder="Search pages, posts, commands..." autocomplete="off" />
    <ul id="command-results"></ul>
  </div>
</div>
```

```js
// assets/js/custom.js
(function () {
  var palette = document.getElementById('command-palette');
  var input = document.getElementById('command-input');
  if (!palette || !input) return;

  document.addEventListener('keydown', function (e) {
    var isHotkey = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
    if (!isHotkey) return;
    e.preventDefault();
    palette.hidden = false;
    input.focus();
  });
})();
```

## Acceptance Checks

- `Cmd+K` and `Ctrl+K` open palette on desktop.
- `Escape` closes palette and restores focus.
- At least 12 commands are listed (nav + posts).
- Keyboard-only users can open and navigate commands.
- Mobile tap fallback exists (icon/button to open palette).

## References

- https://linear.app/now
- https://sweblogs.fyi/

