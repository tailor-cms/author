# health

Liveness, readiness, and deep diagnostics. Liveness and readiness are public,
while `/health/status` is admin-only.

All responses use the common `application/health+json` convention with a
top-level `status` (`pass | warn | fail`). The readiness and diagnostics
reports add a `checks` map; liveness is just `status: pass` + `uptime`/`time`.

## Why the ALB stays on the shallow `/api/healthcheck`

This service currently runs as a **single ECS task** (`desiredCount: 1`, autoscaling
off) behind an ALB. Any signal the ALB consumes can also trigger ECS to
**replace** the only task. If the ALB checked the database and RDS hiccuped,
the task would be killed and the replacement would fail the same check; a
self-inflicted crash loop and full outage from a transient blip.
So liveness (no dependencies) is the correct ALB target.
