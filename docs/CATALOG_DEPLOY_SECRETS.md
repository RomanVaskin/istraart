# GitHub Actions: server credentials for the OLNOO catalog

Deployment-only PR based on main, independent of the open IstraArt PR #7. UI, catalog business logic, Telegram and database are unchanged. No merge/workflow/deploy or manual production changes are performed.

Required existing repository Secrets:
- OLNOO_CATALOG_TOKEN: the same distinct read-only istraart token configured in OLNOO's CATALOG_SITE_TOKENS map (32–256 printable ASCII characters, no whitespace/control characters).
- OLNOO_CATALOG_BASIC_AUTH: the existing external Admin Basic Auth username:password, not base64. Both parts must be nonempty, control/newline characters are rejected. Password spaces, colons, quotes, backslashes, dollar signs and backticks are preserved exactly through JSON; they are never interpreted by a shell or dotenv.

The workflow fixes OLNOO_CATALOG_URL to https://admin.olnoo.com. None of these variables is NEXT_PUBLIC and no Next `env` property is introduced.

The workflow validates mandatory catalog secrets before SSH delivery. A mode-0600 runner temp payload is transmitted only on SSH stdin, never in argv, logs, a heredoc containing values or an artifact. Server delivery uses a same-directory temp file under /opt/istraart, validates JSON before atomic rename to .env.catalog.json, and removes failed temp files. The installed file is owned by deploy with an exact access ACL: owner read/write, www-data read-only, owning group no access, others no access; it is outside public/ and ignored by Git. Existing .env.local is untouched. Existing pinned host-key SSH setup, dirty-tree refusal, ff-only update, pnpm install/build, service restart and HTTP probe remain unchanged.

The next.config.mjs loader reads the file relative to the config itself on both build and normal next start, assigning only the three server variables. Delivery therefore survives the Actions/SSH shell exiting and does not require a systemd EnvironmentFile or nginx change. The confirmed service runtime user is www-data. Every delivery replaces inherited ACL entries on the new temporary file and verifies the exact ACL before atomic rename, so subsequent deploys retain runtime access. No sudo/chown or service-account/unit change is required. setfacl/getfacl must already be available on the RU server; if absent, delivery fails before replacing the existing file and installs no packages. Invalid installed JSON/configuration fails startup with a generic error; missing file remains allowed for local development before secret setup. Missing/invalid GitHub secrets always fail the production workflow before upload/build/restart.

Merge order:
1. Merge OLNOO catalog-secret delivery PR; wait for successful existing deployment.
2. Merge this IstraArt credentials-delivery PR; wait for successful deployment (the pre-PR7 site may remain unchanged).
3. Merge IstraArt PR #7, which now has both layers of credentials ready at runtime.

No PR #7 UI/catalog files are modified here. Its next.config is unchanged from main, so this loader can merge independently. After the sequential deploys, separately check published istraart cards/photos, rejection of other projects/drafts and clean handling of invalid credentials. No live integration is claimed here.

Checks: node --test scripts/catalog-deploy-env.test.mjs; actionlint on deploy.yml; bash -n on run blocks; compare unchanged old deploy steps; fresh-process loader test; build/static-marker scan; apply/merge compatibility check with PR #7. All credential fixtures are synthetic.


## Runtime access correction after PR #8

Confirmed by the owner: istraart.service uses www-data, `sudo -u www-data test -r /opt/istraart/.env.catalog.json` returned ACCESS_DENIED, and Next logged `Cannot read catalog deploy environment`. The previous deployment created a deploy-owned 0600 file, readable for the build but not the service. This is a startup crash before the port opens, not evidence for increasing sleep or changing port 3000.

Delivery now grants only the named runtime user read access, preserving deploy ownership/write access and denying the owning group/other users. `setfacl --set` removes inherited named-user/group grants; merely adding www-data and increasing the ACL mask could have re-enabled inherited access for strangers. ACL is applied to and verified on every new file before rename. No chmod 644/777, fallback to public permissions, secret value change, or restart/probe delay change.

Local tests validate the actual delivery block, exact ACL (including removal of inherited grants), atomically preserving prior files on failure, and Next configuration loading. They do not start the real systemd unit or deploy to production. After an approved deploy, on RU `/opt/istraart`, verify `sudo -u www-data test -r .env.catalog.json`, `getfacl --omit-header .env.catalog.json`, `systemctl is-active istraart.service`, and `curl -fsS -o /dev/null http://127.0.0.1:3000/`. Do not print the file contents.

Verification boundary: the local managed filesystem cannot apply named-user POSIX ACLs (Operation not supported / unmapped UID). The installer unit test records and asserts the exact setfacl/getfacl command contract; the separate real-filesystem ACL test explicitly skips on unsupported environments. This is not a claim of production www-data access or service recovery. On RU the workflow verifies the real ACL before rename, and the unchanged restart/HTTP check must succeed after an approved deployment.
