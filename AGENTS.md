# Agent Instructions

## Web Application

ChronoShift is a TypeScript offline web app hosted on GitHub Pages. Native app tooling has been removed.

- Manage runtimes and developer tools with `mise`; prefer `bun` for package management and scripts.
- Use `gh` for GitHub operations.
- Source is in `web/`; build with `bun run build` and verify with `bun run check` and `bun run format:check`.
- Run appropriate Playwright checks for changes affecting browsers, offline behavior or deployment. See `docs/developer/testing.md`.
- The Pages base path is `/ChronoShift/`; the manifest, service worker and all runtime assets must share it.
- Preserve local-only conversion, explicit update activation and input/result state during resize. No runtime CDN or conversion backend.
- The resilience corpus is a standalone JSON fixture. Maintain it directly; it has no native source/build dependency.

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**
```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**
- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var
