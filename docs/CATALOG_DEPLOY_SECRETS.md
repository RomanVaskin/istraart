# GitHub Actions: server credentials for the OLNOO catalog

Deployment-only PR based on main, independent of the open IstraArt PR #7. UI, catalog business logic, Telegram and database are unchanged. No merge/workflow/deploy or manual production changes are performed.

Required existing repository Secrets:
- OLNOO_CATALOG_TOKEN: the same distinct read-only istraart token configured in OLNOO's CATALOG_SITE_TOKENS map (32–256 printable ASCII characters, no whitespace/control characters).
- OLNOO_CATALOG_BASIC_AUTH: the existing external Admin Basic Auth username:password, not base64. Both parts must be nonempty, control/newline characters are rejected. Password spaces, colons, quotes, backslashes, dollar signs and backticks are preserved exactly through JSON; they are never interpreted by a shell or dotenv.

The workflow fixes OLNOO_CATALOG_URL to https://admin.olnoo.com. None of these variables is NEXT_PUBLIC and no Next `env` property is introduced.

The workflow validates mandatory catalog secrets before SSH delivery. A mode-0600 runner temp payload is transmitted only on SSH stdin, never in argv, logs, a heredoc containing values or an artifact. Server delivery uses a same-directory temp file under /opt/istraart, validates JSON before atomic rename to .env.catalog.json, and removes failed temp files. The installed file is owned by the existing deploy user with mode 0600; it is outside public/ and ignored by Git. Existing .env.local is untouched. Existing pinned host-key SSH setup, dirty-tree refusal, ff-only update, pnpm install/build, service restart and HTTP probe remain unchanged.

The next.config.mjs loader reads the file relative to the config itself on both build and normal next start, assigning only the three server variables. Delivery therefore survives the Actions/SSH shell exiting and does not require a systemd EnvironmentFile or nginx change. The existing service runtime account must retain read access to the deploy-owned app files; this PR changes no service account or unit. Invalid installed JSON/configuration fails startup with a generic error; missing file remains allowed for local development before secret setup. Missing/invalid GitHub secrets always fail the production workflow before upload/build/restart.

Merge order:
1. Merge OLNOO catalog-secret delivery PR; wait for successful existing deployment.
2. Merge this IstraArt credentials-delivery PR; wait for successful deployment (the pre-PR7 site may remain unchanged).
3. Merge IstraArt PR #7, which now has both layers of credentials ready at runtime.

No PR #7 UI/catalog files are modified here. Its next.config is unchanged from main, so this loader can merge independently. After the sequential deploys, separately check published istraart cards/photos, rejection of other projects/drafts and clean handling of invalid credentials. No live integration is claimed here.

Checks: node --test scripts/catalog-deploy-env.test.mjs; actionlint on deploy.yml; bash -n on run blocks; compare unchanged old deploy steps; fresh-process loader test; build/static-marker scan; apply/merge compatibility check with PR #7. All credential fixtures are synthetic.
