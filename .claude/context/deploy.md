# Deployment

Read this when deploying changes to dev or prod.

## Environments

- **Dev**: https://dev.simuciokas.uk — Linux VM, served from a Cloudflared tunnel pointing at `kestrel-dev.service`. App dir `/var/www/app-dev/`. Hot environment for visual verification.
- **Prod**: https://simuciokas.uk — same VM, `kestrel.service`, app dir `/var/www/app/`.

VM SSH host, user, and password live in Claude's auto-memory (`~/.claude/.../memory/dev_environment.md`) — kept out of this repo deliberately.

## Rule

Always deploy user-facing changes to dev as the final step of the change. See `~/.claude/.../memory/deploy_on_change.md`.

## Dev deploy flow

From the project root on Windows:

1. **Publish** the release build:
   ```powershell
   dotnet publish -c Release -o ./publish
   ```
2. **Bundle**:
   ```powershell
   tar -czf publish.tar.gz -C publish .
   ```
3. **Upload** to the VM's `/tmp/` (resolve `<user>` and `<vm-host>` from auto-memory):
   ```powershell
   pscp publish.tar.gz <user>@<vm-host>:/tmp/
   ```
4. **On the VM**, extract to a staging dir, rsync into the app dir (excluding the DB and user uploads), fix ownership, restart:
   ```bash
   mkdir -p /tmp/publish-staging && tar -xzf /tmp/publish.tar.gz -C /tmp/publish-staging
   rsync -a --delete --exclude=app.db --exclude=uploads/ /tmp/publish-staging/ /var/www/app-dev/
   chown -R simas:simas /var/www/app-dev
   systemctl restart kestrel-dev
   ```
5. **Verify**:
   ```bash
   curl -sk -o /dev/null -w "%{http_code}\n" https://dev.simuciokas.uk/healthz
   ```

The `--exclude=app.db --exclude=uploads/` are critical — `app.db` carries production-shaped suggestion + feedback data, and `uploads/` holds user-submitted attachments. Both are recoverable only from VM-side backups (which don't currently exist — known gap).

## Schema migrations on deploy

`SchemaMigrator.Run` executes once at boot (after DI is built, before endpoint mapping). It checks `SchemaVersion` and applies pending migrations in their own transactions. On a legacy DB (no `SchemaVersion` table), `BackfillFromExistingSchema` inspects `sqlite_master` / `pragma table_info` and marks pre-existing migrations as applied without re-running them.

This means a fresh deploy against the real prod DB is safe — versioning catches up automatically on first boot.

## Cloudflare in front

- **CDN**: Static assets cached by Cloudflare. Cache-busting via `asp-append-version` (`?v=<hash>`) — different hash = different URL = guaranteed fresh fetch. See `static-files.md`.
- **`robots.txt`**: The origin file in `wwwroot/robots.txt` is overridden at the edge by Cloudflare's "AI Scrapers" feature (Content-Signals robots.txt). The origin file is a fallback if that feature is ever disabled.
- **CF-Connecting-IP**: All client-IP resolution server-side uses this header. See `server.md`.
- **Tunnel**: dev.simuciokas.uk routes through cloudflared → localhost:5001 on the VM.

## What's still manual

- No GitHub Actions deploy workflow yet. Tracked.
- No daily `app.db` backup on the VM. Tracked.
- No Cloudflared health-check config pointing at `/healthz`. Tracked.
