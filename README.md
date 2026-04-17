# AdaNeu — AI Expert Teammates, Tracked in Git

<div align="center">

**Ada + Neural = AdaNeu**

*"I dunno how to do this..." — That's when you call AdaNeu.*

[Website](https://adaneu.com) · [Discussion](https://github.com/claude-optima/adaneu/discussions) · [Issues](https://github.com/claude-optima/adaneu/issues)

</div>

---

## What is AdaNeu?

AdaNeu provides **git-tracked AI expert teammates** that integrate into your organization as transparent, auditable collaborators. Unlike black-box AI assistants, every action an AdaNeu teammate takes is a git commit — fully traceable, reversible, and trustworthy.

## Why AdaNeu?

| Problem | AdaNeu Solution |
|---------|----------------|
| AI tools are black boxes | Every action is a git commit |
| No audit trail for AI work | Immutable git history |
| One-size-fits-all AI | Specialized expert teammates |
| Proprietary lock-in | GitHub-native, open source |
| Can't undo AI changes | `git revert` any action |

## How It Works

```
1. Assign → Push a task to the inbox (any device, any IDE)
2. Claim  → The right expert teammate picks it up
3. Work   → Every change is committed transparently
4. Review → Review like any PR, approve or revert
```

### The Git-Based Workflow

```bash
# Assign a task from anywhere
echo "Migrate auth API to v2" > .optima/inbox/migrate-auth.md
git add . && git commit -m "task: migrate auth API" && git push

# Expert picks it up automatically
# [git] committed: picked up 'migrate-auth.md'
# [git] pushed to remote

# Full audit trail
git log --author="@backend-expert" --oneline
```

## Expert Teammates

Deploy role-based AI experts, each with deep domain knowledge:

- **Backend Engineer** — API design, database optimization, migrations
- **Security Reviewer** — Vulnerability scanning, compliance, access control
- **DevOps Specialist** — CI/CD, infrastructure, deployment automation
- **Frontend Expert** — UI components, accessibility, performance
- **Technical Writer** — Documentation, API specs, collaboration stories
- **Architecture Advisor** — System design, scalability, trade-off analysis

## Key Features

- **🔗 Git-Native** — Task assignment, status tracking, and audit trail through git
- **👥 Multi-Agent** — Parallel execution with multiple expert teammates
- **📊 Real-Time Visibility** — Kanban boards, dashboards, activity logs
- **🔄 Self-Healing** — Auto-retry failed tasks with learned context
- **🌐 GitHub-Native** — Discussions, Issues, PRs — no proprietary UI
- **🛡️ Immutable History** — Every action is a commit, every state is recoverable

## Trust & Transparency

AdaNeu is built on a simple principle: **if it's not in git, it didn't happen.**

- **Immutable audit trail** — Git commits can't be altered
- **Spec before code** — Design docs reviewed before implementation
- **Full rollback** — `git revert` any change, anytime
- **Per-agent isolation** — Isolated logs, workspaces, and activity tracking
- **Open source** — Inspect every line of code

## Architecture

```
.optima/
├── inbox/              # Drop task files here
├── in-progress/        # Currently being worked on
├── completed/          # Successfully completed
├── failed/             # Failed (with error context)
├── specs/              # Design specifications
├── activity.log        # Per-agent activity log
├── heartbeat.json      # Agent liveness tracking
└── delegations/        # Multi-agent task routing
```

## Getting Started

```bash
# Clone the repo
git clone https://github.com/claude-optima/adaneu.git

# Initialize the workspace
python scripts/optima_init.py

# Start watching for tasks
python scripts/watch_all.py --repo your-org/your-repo --discussion 1 --git-pull
```

## The Name

**AdaNeu** = **Ada** (after Ada Lovelace, the first programmer) + **Neu**ral

It sounds like "I dunno" — and that's intentional. When someone says *"I don't know how to do this"*, that's exactly when they should call an AdaNeu teammate.

## License

MIT

---

<div align="center">

**Built with transparency.** Every commit tells a story.

[adaneu.com](https://adaneu.com)

</div>
