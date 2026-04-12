# TESTING.md

## Testing philosophy
- Unit tests prove logic.
- Integration tests prove contracts.
- Smoke and browser checks prove the product works.
- Tests passed is not enough for customer-facing fixes.

## Required validation by change type

### UI-only changes
- Run relevant component/unit tests
- Run build
- Verify the affected page or flow visually

### API or backend changes
- Run route/service tests
- Run build
- Verify the endpoint or full flow

### Data model changes
- Run migration/schema tests if available
- Verify inserts and selects
- Verify old data behavior and stale-data implications

### Auth / billing / quota / admin / security changes
- Run targeted tests
- Run build
- Verify at least one full real path end-to-end

### AI / scoring / extraction / recommendation changes
- Run deterministic tests
- Run regression tests using known failure cases
- Verify at least one real or realistic end-to-end example
- Decide whether stale cached data must be invalidated

## Minimum pre-push gate
- `[test command]`
- `[build command]`

## Minimum pre-deploy gate
- Relevant targeted tests pass
- Build passes
- Env vars or config changes checked
- Any cache invalidation plan decided

## Minimum post-deploy gate
- Verify deployment is the intended version
- Hit one critical endpoint
- Check one core user flow
- Check one previously failing case if the change is a bug fix

## When a user-reported bug is fixed
The fix is not complete until:
1. There is a regression test using the real failure shape if possible
2. Build passes
3. The running system is checked on the actual failing path
4. Any stale derived data or cache is handled

## Failure report format
When something still fails, record:
- exact failing path
- expected behavior
- actual behavior
- likely layer: UI / API / DB / cache / provider / deploy / config
- what was already ruled out
