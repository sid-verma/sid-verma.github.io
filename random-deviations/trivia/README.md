# Trivia component

This directory vendors the self-contained playable release from
`/Users/sidverma/Documents/ChatGPT/QuizMaster/github-pages/index.html`.
The source application is developed in the separate QuizMaster task. It is not
a Git submodule: deployment needs no second checkout, build step, or repository.

All ten categories, boards, question/safety/answer screens, host tools, question
pool, font, and visual assets are embedded in `index.html`. Keep this document
and the font license with updates. Do not copy the release's `.nojekyll` into
the blog root, because the blog needs Jekyll.

The integration keeps the original release byte-for-byte so updates can be
compared with `shasum -a 256`. Its localStorage key remains `curiosity-club-v1`;
other deployments on the same origin using that key share saved state. Backups
are portable through the host desk. Source PDFs, private compendium, and review
files are deliberately outside this component.

The game is served at `/random-deviations/trivia/` and linked from the
Random Deviations post at `/random-deviations/`. It has a standalone document
to isolate full-screen game styles from the blog's CSS and navigation scripts.
