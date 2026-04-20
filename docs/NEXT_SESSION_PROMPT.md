# Exact Prompt For The Next Session

Use this prompt to hand the project to a new Codex/PCO session without losing context:

---

You are taking over the FightInsuranceDenials project.

Start in:
- `C:\Users\sashi\Projects\FightInsuranceDenials-working`

Read these files first, in order:
1. `docs/HANDOFF_START_HERE.md`
2. `docs/PROJECT_INTENT.md`
3. `docs/AGENT_CURRENT_STATE.md`
4. `docs/ARCHITECTURE.md`
5. `docs/SKILL_PLAYBOOK.md`
6. `docs/LESSONS_LEARNED.md`
7. `docs/TODO.md`
8. `docs/MVP_FEEDBACK_TRACKER.md`
9. `docs/BIGQUERY_INSIGHTS_REPORT.md`
10. `docs/AGENT_EXECUTION_GUIDE.md`

Branch / repo expectations:
- use the real repo, not a stale sandbox copy
- confirm current branch and latest commit before editing
- stay on or branch from `codex/fix-everything-2026`

What the project is trying to do:
- build the first public, patient-usable database of real health insurance denials
- help patients search matching denials and use precedent in appeals
- evolve into a credible data product for hospitals, lawyers, regulators, and employers

Current state to assume:
- Sprint 3.0 usability overhaul has already improved homepage and `/data-visualizations`
- use `1,173 public stories` as the public count source of truth
- homepage, evidence patterns, and data visualizations are the strongest pages right now
- `Fight Back`, `Share Your Story`, and `Data Products` still need major polish

What to do first:
1. run `git status`
2. run `git log --oneline -5`
3. run `npm test`
4. run `npm run lint`
5. run `npm run build`
6. verify production if the task is public-facing

Skills to use:
- Superpowers
- karpathy-guidelines
- frontend-design
- test-driven-development
- project-planner
- executing-plans
- requesting-code-review
- verification-before-completion

Important lessons:
- do not spend time on shallow connector work unless it clearly changes usable evidence
- do not let pages regress into text-heavy AI-looking card walls
- do not assume the warehouse signal is already visible on the site
- do not invent stories or fake proof objects

Best next likely priorities:
1. bring `Fight Back`, `Share Your Story`, and `Data Products` up to the Sprint 3.0 clarity standard
2. create a truly sellable data-product preview or export
3. add browser screenshot/video proof and stronger live verification
4. continue improving evidence density and public warehouse modules

---
