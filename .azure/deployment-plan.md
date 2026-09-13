# Azure Deployment Plan

Status: Draft

## Scope
- Application: Lucky Winner Power
- Components: Vite/React player web app, backend API, admin portal, Android player/admin wrappers
- Requested outcome: deploy backend and admin to Azure and produce a production Android APK

## Current Findings
- The web app currently uses Vercel rewrites and serverless functions under `api/`.
- The `/games` page links to third-party game URLs; first-party game implementations are not present in the repository.
- Android has `player` and `admin` flavors, but release signing is not configured.
- Azure infrastructure files are not present.

## Decisions Pending User Confirmation
- Game catalog, source code/assets, and licensing/redistribution rights
- Azure subscription, resource group, region, hosting target, domain, and budget
- Production secrets and managed identity design
- Android package IDs, signing keystore, and distribution channel

## Proposed Validation Gates
- Static source and dependency audit
- Frontend production build
- Backend endpoint and security checks
- Admin authorization checks
- Android debug and release builds
- Signed APK verification and install smoke test
- Azure pre-deployment validation

## Status
This plan remains Draft until the pending decisions are confirmed. No Azure deployment has been executed.
