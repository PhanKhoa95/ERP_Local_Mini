# Release Process

This project uses three version tracks:

| Track | Source of truth | Rule |
| --- | --- | --- |
| App version | `package.json` and `VERSION` | Semantic Versioning: `MAJOR.MINOR.PATCH` |
| Database schema | `supabase/migrations` | Forward-only timestamped migrations |
| Edge Functions | `supabase/functions/*` | Deployed with the matching app release notes |

## Release Checklist

1. Confirm the working tree only contains intended changes.
2. Update `VERSION`.
3. Update `package.json` version to match `VERSION`.
4. Run `npm install --package-lock-only --ignore-scripts` so `package-lock.json` matches.
5. Add a new section to `CHANGELOG.md`.
6. Confirm all new database changes have timestamped migrations.
7. Run:

```sh
npm run release:check
npm run typecheck
npm run lint
npm run test
npm run build
```

8. Commit with a release-oriented message, for example:

```sh
git commit -m "chore: release v0.1.0"
```

9. Tag the release:

```sh
git tag v0.1.0
```

10. Push commits, tags, Supabase migrations and matching Edge Functions.

## Version Rules

- Patch release: bug fixes, small UI fixes, docs and low-risk behavior corrections.
- Minor release: new modules, new workflow surfaces, additive migrations and new integration capabilities.
- Major release: breaking schema changes, auth/security model changes, incompatible API behavior or destructive migration strategy changes.

## Rollback Rules

- App rollback uses the previous git tag or deployment.
- Supabase migrations are forward-only. Create a new reversal migration instead of editing or deleting an applied migration.
- Edge Function rollback redeploys the previous function source that belongs to the previous app tag.

