# Versioning Standard

## Current Baseline

Current app version: `0.1.0`

The version is stored in both:

- `VERSION`
- `package.json`

Both files must match before a release.

## Version Tracks

| Area | Versioning method | Owner file/folder |
| --- | --- | --- |
| Web app | Semantic Versioning | `VERSION`, `package.json`, `CHANGELOG.md` |
| Database | Forward-only migrations | `supabase/migrations` |
| Edge Functions | App release notes plus function deploy list | `supabase/functions`, `RELEASE.md` |
| Dependencies | Lockfiles | `package-lock.json`, `deno.lock` |

## Required Release Evidence

Every release must include:

- Version bump in `VERSION` and `package.json`.
- Matching `package-lock.json` root package version.
- `CHANGELOG.md` entry with Added, Changed, Fixed or Security notes.
- Migration list when schema changed.
- Edge Function deployment list when serverless code changed.
- Verification commands and result summary.

## Branch and Tag Convention

- Feature branch: `feat/<short-topic>`
- Fix branch: `fix/<short-topic>`
- Release branch: `release/v<version>`
- Release tag: `v<version>`, for example `v0.1.0`

## Migration Discipline

- Never edit or delete migrations that may already be applied.
- Add a new timestamped migration for every database change.
- Update `src/integrations/supabase/types.ts` when schema fields change.
- Include migration names in the release changelog.

