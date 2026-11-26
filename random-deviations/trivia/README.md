# Trivia component

This directory vendors the self-contained playable release from
`/Users/sidverma/Documents/ChatGPT/QuizMaster/github-pages/index.html`.
The source application is developed in the separate QuizMaster task. It is not
a Git submodule: deployment needs no second checkout, build step, or repository.

All ten categories, boards, question/safety/answer screens, question
pool, font, and visual assets are embedded in `index.html`. The team-rating
editor and balance policy are local companions: `host-ratings.js`,
`host-ratings.css`, and `balance.js`. Keep these files, this document
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

Shuffle starts from one question per category and point tier (50 total).
For category c, inverse weight is `1 / (1 + 3 * (maxRating - minRating) / 10)`.
Candidate transfers and paired swaps preserve ten questions at each point
tier, at least one per category, and the available pool capacity. A team's
estimated opportunity is the sum of `points * rating / 10`, divided by total
points. Selection minimizes the largest difference between teams, then variance,
then deviation from inverse-weight category shares. The equal-category starting
allocation remains the fallback: the estimated spread never increases.

This bounded randomized local search is a heuristic, not a claim of a global
optimum or calibrated answer probabilities. With equally rated teams, category
allocation remains equal. With a team stronger everywhere, a residual gap may
be unavoidable. The Host shows the applied spread and equal-category baseline.
New clues are preferred within the selected category/tier buckets.

Run `node script/test-trivia-balance.cjs` for 150 seeded allocation trials plus
pool-capacity and validation cases. Run `node script/test-trivia-host.cjs` with
the same Playwright environment as above and `QUIZ_URL` set to the built game
to exercise slider/radar, team switching, setup gating, shuffling, boards and
saved-game restoration in the browser.
