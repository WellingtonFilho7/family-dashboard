---
name: deploy-status
description: Verify a Vercel deployment after pushing - build status, build logs, runtime errors. Use after every push that should deploy, or when the user asks "did the deploy work / is it live / why is the kiosk broken". NEVER commit version badges, markers, or console.logs to verify a deploy - use this instead.
---

# Deploy Status (Vercel MCP)

This project deploys as **`family-dashboard`** on Vercel team **`wellington-filhos-projects`** (`team_7bSZNhmPEsd1wAQYajxtdvnw`, project `prj_IdfdTynKVgIB6xD9qROYxou6aSB3`).

## Steps

1. `mcp__Vercel__list_deployments` with the teamId + projectId — find the deployment matching your commit (`meta.githubCommitSha` vs `git rev-parse HEAD`).
2. `state` READY → live. ERROR → `mcp__Vercel__get_deployment_build_logs`, fix, push again. BUILDING/QUEUED → wait and re-check; never push marker commits meanwhile.
3. After READY, check `mcp__Vercel__get_runtime_errors`. A green build with runtime errors (e.g. missing env vars, Supabase unreachable) is the classic failure here.
4. On PRs, the Vercel bot comment carries the preview URL and status — read it before doing anything else.
5. Env vars are build-time: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` must be set in the Vercel project for Production AND Preview, and changing them requires a redeploy.
6. If the app builds but shows no data, check whether the Supabase project (`bhivkldkdsayzhuylqxd`) is paused — free-tier projects auto-pause on inactivity. Use the `schema-sync` skill's status check.
