# AdaNeu — Environment Setup & Infrastructure

## Overview

This document describes the complete infrastructure setup for the AdaNeu platform, including hosting, CI/CD, DNS, authentication, and Azure resources.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    adaneu.com                        │
│              (Custom Domain / DNS)                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│         Azure Static Web Apps (Free Tier)            │
│         App: adaneu-web                              │
│         Region: eastus2                              │
│         URL: salmon-dune-03a6fac0f.7.azurestaticapps │
└──────────────────────┬──────────────────────────────┘
                       │ Auto-deploy on push
┌──────────────────────▼──────────────────────────────┐
│         GitHub Repository                            │
│         claude-optima/adaneu                         │
│         Branch: main                                 │
└──────────────────────┬──────────────────────────────┘
                       │ GitHub Actions
┌──────────────────────▼──────────────────────────────┐
│         CI/CD Pipeline                               │
│         .github/workflows/azure-static-web-apps.yml  │
│         Trigger: push to main, PRs                   │
└─────────────────────────────────────────────────────┘
```

## Azure Resources

### Resource Group
- **Name**: `rg-adaneu`
- **Location**: `eastus`
- **Subscription**: `11ee7021-7c5d-4710-be6c-d110fd4c9cd4`

### Static Web App
- **Name**: `adaneu-web`
- **SKU**: Free
- **Location**: `eastus2` (SWA requires different regions than RG)
- **Default URL**: `https://salmon-dune-03a6fac0f.7.azurestaticapps.net`
- **Custom Domain**: `adaneu.com` (validation pending TXT record)

### Service Principal
- **Name**: `sp-adaneu-optima`
- **Role**: Contributor
- **Scope**: `/subscriptions/.../resourceGroups/rg-adaneu`
- **Credentials**: Stored in `.env` (gitignored)

## DNS Configuration

### Current Setup (GitHub Pages → Azure Migration)

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | @ | 185.199.108.153 | GitHub Pages (to be replaced) |
| A | @ | 185.199.109.153 | GitHub Pages (to be replaced) |
| A | @ | 185.199.110.153 | GitHub Pages (to be replaced) |
| A | @ | 185.199.111.153 | GitHub Pages (to be replaced) |
| TXT | @ | `_nq89z3pyn5zqqsebt74889afp2mwnwy` | Azure domain validation |
| CNAME | www | `salmon-dune-03a6fac0f.7.azurestaticapps.net` | Azure SWA |

### Target Setup (Azure SWA)

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| ALIAS/CNAME | @ | `salmon-dune-03a6fac0f.7.azurestaticapps.net` | Azure SWA apex |
| TXT | @ | `_nq89z3pyn5zqqsebt74889afp2mwnwy` | Domain validation |
| CNAME | www | `salmon-dune-03a6fac0f.7.azurestaticapps.net` | Azure SWA www |

## CI/CD Pipeline

### GitHub Actions Workflow

File: `.github/workflows/azure-static-web-apps.yml`

**Triggers:**
- Push to `main` → Build and deploy
- Pull request → Preview deployment
- PR closed → Clean up preview

**Secrets Required:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN` — SWA deployment token (set via GitHub API)

### Deployment Flow

```
Developer pushes to main
    → GitHub Actions triggered
    → Azure/static-web-apps-deploy@v1
    → Site deployed to Azure SWA
    → Available at adaneu.com within ~30 seconds
```

## Local Development

### Prerequisites
- Git
- Any web server for local preview (e.g., `python -m http.server`)

### Quick Start
```bash
git clone https://github.com/claude-optima/adaneu.git
cd adaneu
python -m http.server 8000
# Open http://localhost:8000
```

## Environment Variables

Stored in `.env` (gitignored, never committed):

| Variable | Purpose |
|----------|---------|
| `CLAUDE-OPTIMA-GITHUB-TOKEN` | GitHub fine-grained PAT |
| `CLAUDE-OPTIMA-GITHUB-CLASSIC-TOKEN` | GitHub classic PAT (repo access) |
| `AZURE_SP_APP_ID` | Azure Service Principal App ID |
| `AZURE_SP_PASSWORD` | Azure Service Principal Secret |
| `AZURE_TENANT_ID` | Azure AD Tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID |
| `AZURE_RESOURCE_GROUP` | Azure Resource Group name |
| `AZURE_SWA_DEPLOY_TOKEN` | Static Web App deployment token |

## Security Notes

1. **All credentials** are stored in `.env` which is in `.gitignore`
2. **Service Principal** has Contributor role scoped to `rg-adaneu` only (least privilege)
3. **GitHub secrets** are encrypted using libsodium sealed boxes
4. **Azure SWA** provides free SSL/TLS certificates automatically
5. **No secrets in code** — all configuration via environment variables

## Future Infrastructure (Planned)

| Component | Azure Service | Purpose | Status |
|-----------|--------------|---------|--------|
| Auth | Azure AD B2C / SWA built-in | User authentication | Planned |
| API | Azure Functions (Python) | Backend logic, pricing calc | Planned |
| Database | Cosmos DB (free tier) | User data, org tracking | Planned |
| Storage | Azure Blob Storage | Document storage | Planned |
| Monitoring | Application Insights | Usage analytics | Planned |
