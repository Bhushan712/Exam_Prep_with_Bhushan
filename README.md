# Office Skills Practice

A self-contained web app for practicing Microsoft Word, Excel, PowerPoint, and AI Usage — 20 multiple-choice questions per subject, instant feedback, and a results review screen. No sign-in, no build step, no dependencies to install.

## Files

- `index.html` — entry point
- `style.css` — design system (colors, type, layout)
- `script.js` — app logic (menu, quiz, scoring, results)
- `questions.js` — the question bank (edit this to add/change questions)

## Run it locally

Just open `index.html` in a browser — no server or build step required.

## Publish on GitHub Pages

1. Create a new repo (or a folder in your existing `portfolio_26` repo), e.g. `office-skills-practice`.
2. Upload these four files (`index.html`, `style.css`, `script.js`, `questions.js`) to the repo root.
3. Go to **Settings > Pages** in the repo.
4. Under "Build and deployment", set **Source: Deploy from a branch**, branch: `main`, folder: `/ (root)`.
5. Save. GitHub gives you a live URL like:
   `https://<your-username>.github.io/office-skills-practice/`

If you'd rather nest it inside your existing portfolio repo (`Bhushan712/portfolio_26`), just drop these four files into a subfolder, e.g. `/office-skills-practice/`, and it will be reachable at:
`https://bhushan712.github.io/portfolio_26/office-skills-practice/`

## Adding more subjects or questions

Open `questions.js`. Each subject is an object with a `label`, `tagline`, `color` (hex, used for that subject's accent throughout the UI), and a `questions` array. Each question looks like:

```js
{ q: "Question text?", options: ["A", "B", "C", "D"], correct: 1, note: "Explanation shown after answering." }
```

To add a fifth subject, copy one of the existing subject blocks, give it a new key (e.g. `outlook`), and the landing page will automatically add a new tab — no other code changes needed.

## Notes on scoring

- Each attempt pulls up to 20 questions (shuffled) from that subject's bank.
- "Best score" per subject is saved in the browser's local storage, so it persists between visits on the same device/browser, but isn't shared across devices or visible to you as the site owner — nothing is sent anywhere.
