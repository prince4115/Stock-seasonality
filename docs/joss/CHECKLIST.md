# JOSS submission checklist

Step-by-step recipe to take this repository from "local Git" to "JOSS
paper under review." Estimated time: **2–4 hours of focused work,**
spread across one evening.

## Pre-submission: things to do once

These are one-time setup items you'll need before submitting.

- [ ] **Create / sign in to GitHub** at https://github.com.
- [ ] **Register an ORCID** at https://orcid.org/register (free, 5 min).
      Replace the `0000-0000-0000-0000` placeholder in
      `docs/joss/paper.md` with your actual ORCID iD.
- [ ] **Read the JOSS submission requirements** at
      https://joss.readthedocs.io/en/latest/submitting.html. The two
      pages that matter most:
      - "Submission requirements" — checks your repo against their bar.
      - "What should my paper contain?" — confirms our paper.md hits
        the right beats.

## Step 1: Push the repo to GitHub ✅ DONE (2026-06-01)

```bash
cd stock-seasonality

# Create the GitHub repo via the web UI:
#   https://github.com/new
#   Name:        stock-seasonality
#   Description: Calendar and event-window seasonality analysis for
#                consumer-spending equities.
#   Visibility:  Public  (required for JOSS)
#   Do NOT add README / .gitignore / LICENSE — we have them.

# Then locally, add the remote and push:
git remote add origin https://github.com/prince4115/Stock-seasonality.git
git push -u origin main
```

After push, verify on GitHub that:

- [ ] `README.md` renders nicely on the repo's landing page.
- [ ] `LICENSE` is detected by GitHub (a "License: MIT" label appears).
- [ ] `docs/joss/paper.md` and `docs/joss/paper.bib` are present.

## Step 2: Verify the JOSS bar

JOSS reviewers check these against your repo. Tick each box yourself
before submitting.

- [ ] **Open source license.** ✅ MIT, present at `LICENSE`.
- [ ] **Public repository.** ✅ Public after Step 1 above.
- [ ] **README with installation, usage, examples.** ✅ Present.
- [ ] **Substantial scholarly effort.** ✅ ~10,000 lines of code, 7
      database models, 66 unit tests, 6 phased iterations, full
      methodology in `docs/paper.md`. Comfortably above the bar.
- [ ] **Automated tests with reasonable coverage.** ✅ 66 vitest tests
      across 4 files; all pure-function modules covered. Run with
      `npm test`.
- [ ] **Community guidelines / contribution instructions.** ⚠️ Not
      explicit. If reviewers ask, point them to the README's "Project
      structure" section and the inline code documentation; or add a
      one-paragraph "Contributing" section to the README.
- [ ] **Paper file** at `docs/joss/paper.md` with YAML frontmatter,
      Summary, Statement of need, and references. ✅ Present.
- [ ] **References list** at `docs/joss/paper.bib`. ✅ Present.

## Step 3: Tag a release on GitHub

JOSS asks for a specific release to review. Tag the current `main`:

```bash
git tag -a v0.1.0 -m "Initial JOSS submission"
git push origin v0.1.0
```

Then on GitHub:

- [ ] Go to the repo → Releases → "Create a new release."
- [ ] Pick tag `v0.1.0`.
- [ ] Title: "v0.1.0 — initial JOSS submission."
- [ ] Description: a short summary of what's in the release. Copy/paste
      the README's "What's inside" section.
- [ ] Publish the release.

## Step 4: Submit to JOSS

Go to https://joss.theoj.org/papers/new and fill in:

- [ ] **Repository URL:** `https://github.com/prince4115/Stock-seasonality`
- [ ] **Software version:** `v0.1.0` (matches your release tag)
- [ ] **Branch with paper file:** `main`
- [ ] **Paper file path within the repository:** `docs/joss/paper.md`
- [ ] **Author name and ORCID:** as in `paper.md`
- [ ] **Track:** "Computer science and informatics" — best fit for a
      tooling/methodology paper. (You can also pick "Mathematics,
      Physics, and Astronomy" if you'd rather lean on the finance
      side; both have published similar work.)
- [ ] Click "Submit your paper."

You'll get an email confirming the submission and a link to the public
GitHub issue that tracks your review.

## Step 5: Respond to reviewer feedback

Two reviewers are usually assigned within 1–2 weeks. They post comments
on the public GitHub issue.

- [ ] Watch the GitHub issue for your submission.
- [ ] Reviewers may ask for: a tutorial, sample outputs, missing tests,
      methodology clarifications, or paper-text edits.
- [ ] Respond promptly — JOSS reviews are conversational, not anonymous
      gates. Most submissions get accepted after 1–2 review rounds.
- [ ] When the editor signals acceptance, you'll get a DOI for the
      paper that you can cite.

## Things you might be asked, and how to answer them

| Likely reviewer question | Where to point them |
|---|---|
| "What's the contribution?" | README + paper §2 (statement of need) |
| "How do I run it?" | README "Quick start" |
| "Where are the tests?" | `npm test` runs 66; src/lib/analysis/*.test.ts and src/lib/rate-limit.test.ts |
| "How are returns computed?" | `docs/paper.md` §4 (long form) or `paper.md` Methodology |
| "Why no ML?" | `docs/paper.md` §4.4 |
| "What about survivorship bias?" | `docs/paper.md` §2.3 + 4.3; schema fields `Stock.delisted` and `Stock.delistedAt` |
| "Why these specific tickers?" | README "What's inside" + `prisma/seeds/stocks.ts` (the universe construction logic) |

## After acceptance

JOSS publishes papers in real time once accepted — there's no batch
issue cadence.

- [ ] Update `README.md` "Citing this software" section with the JOSS
      DOI once issued.
- [ ] Update `docs/paper.md` (the long-form paper) to cite your own
      JOSS paper if you submit elsewhere later.

## Total effort estimate

| Step | Effort |
|---|---|
| 1. Create GitHub repo + push | 15 min |
| 2. Verify JOSS bar (already met) | 15 min |
| 3. Tag release | 5 min |
| 4. Submit at joss.theoj.org | 15 min |
| 5. Reviewer round 1 (when it arrives) | 1–2 hours |
| 5. Reviewer round 2 (if needed) | 1 hour |
| **Submission alone: ~1 hour. Through acceptance: 4–8 weeks calendar.** | |
