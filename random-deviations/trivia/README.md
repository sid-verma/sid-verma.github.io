# Trivia component

This directory vendors the self-contained playable release from
`/Users/sidverma/Documents/ChatGPT/QuizMaster/github-pages/index.html`.
The source application is developed in the separate QuizMaster task. It is not
a Git submodule: deployment needs no second checkout, build step, or repository.

All ten categories, boards, question/safety/answer screens, question
pool, font, and visual assets are embedded in `index.html`. The team-rating
editor, selection policy, reveal layout, and scoring are local companions:
`host-ratings.js`, `host-ratings.css`, `balance.js`, `reveal.js`, `reveal.css`,
`scoring.js`, `scoreboard.js`, and `scoreboard.css`. Keep these files, this document
and the font license with updates. Do not copy the release's `.nojekyll` into
the blog root, because the blog needs Jekyll.

The original release was migrated byte-for-byte; the Host rating feature now
extends that release in this repository. Its localStorage key remains `curiosity-club-v1`;
other deployments on the same origin using that key share saved state. Backups
are portable through the host desk. Source PDFs, private compendium, and review
files are deliberately outside this component.

The game is served at `/random-deviations/trivia/` and linked from the
Random Deviations post at `/random-deviations/`. It has a standalone document
to isolate full-screen game styles from the blog's CSS and navigation scripts.

## Verification

Run `node script/test-trivia.cjs` from the repository root with Playwright
available through `NODE_PATH`. Set `QUIZ_CHROME` to a Chrome executable if the
Playwright Chromium binary is unavailable. For an HTTP build, set `QUIZ_URL`
to the nested game URL and `BLOG_URL` to the blog root. The latter also checks
the sidebar → blog post → game links.

The regression checks cover ten categories, five tiles per category, the
question/safety/answer sequence, points, saved progress after reload, runtime
errors, and document overflow at 320, 390, 768, and 1440 CSS pixels.
They do not establish full screen-reader or cross-browser conformance.

## Team ratings and balanced selection

Host → Teams has ten 0–10 sliders per team and a live ten-axis radar chart.
Five means neutral; Save team confirms that profile. Existing games retain their
scores and questions but require rating confirmation before the next shuffle.
Ratings travel with saved games and backups. Importing a replacement bank or
restoring the starter bank requires a new rating review.

Shuffle starts from one question per category and point tier. For each category,
the active tier cap is `clamp(ceil(mean team rating), 1, 5)`. Neutral ratings of
5 and above keep all five tiers. A mean rating of 2 keeps only 10 and 20 points.
The pool may contain alternative clues for a tier, but a board never contains
more than one question per category/point pair.

For category c, inverse weight is `1 / (1 + 3 * (maxRating - minRating) / 10)`.
The selector can further trim only the highest remaining tier, never transfer
slots or add duplicate tiers. It minimizes point-weighted estimated opportunity
spread, then variance, then deviation from the inverse-weighted category shares.
The average-adjusted starting board is the fallback, so further trimming never
worsens that baseline spread. Total questions and total available points may
decrease; there is no fixed 50-question requirement. New clues are preferred
within each selected category/tier bucket.

This greedy search is a heuristic, not a claim of a global optimum or calibrated
answer probabilities. With a team stronger everywhere, a residual gap can be
unavoidable. The Host shows the resulting spread and average-adjusted baseline.
Old version-2 boards are migrated to contiguous, unique tiers, preserving team
scores and giving completed questions preference when removing duplicates.

Run `node script/test-trivia-balance.cjs` for 210 seeded allocation trials plus
pool-capacity and validation cases. Run `node script/test-trivia-host.cjs` with
the same Playwright environment as above and `QUIZ_URL` set to the built game
to exercise slider/radar, team switching, setup gating, shuffling, boards and
saved-game restoration in the browser.

## Unified reveal and split points

The answer always appears on the left, its image on the right, and clue
connections in a banner beneath them. The content scrolls within the reveal
page on smaller screens; no Answer/Image/Clues/Score tabs are used.

Award points opens an inline field for every team. Award partial credit or
split the question value across teams with up to two decimal places. Cumulative
awards cannot exceed the question value times its scoring multiplier. Undo
reverses the latest split transaction as a whole, including after backup/reload.

`node script/test-trivia-scoring.cjs` tests decimal arithmetic, split limits,
validation, and atomic undo. `node script/test-trivia-reveal.cjs` checks the
illustrated strips, reveal layout at five viewport sizes, fractional split
awards, rejection of over-awards, draft preservation during resize, and reload.

The scoreboard uses the category tiles’ bold Helvetica type. Names and scores
fit to the available slot height and width after render, score changes, paging,
and resize. Long names retain their full text in a tooltip if truncation is
necessary; score digits remain visible. `node script/test-trivia-scoreboard.cjs`
checks 25 screen-width/team-count combinations, including large and fractional
scores and paging.
