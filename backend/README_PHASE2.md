# ClusterOps Backend — Phase 2

Phase 2 adds the Slurm-inspired scheduler simulation on top of the Phase 1 backend.

## What Phase 2 adds

- Automatic queued job processing
- Online node resource matching
- CPU/RAM/GPU reservation when jobs start
- Resource release when jobs complete/fail/cancel
- Simulated job lifecycle: `queued -> running -> completed` or `queued -> running -> failed`
- Slurm-style log messages
- Simulated output generation
- Scheduler status endpoint
- Manual scheduler tick endpoint for testing

## New environment variables

Add these to `.env`:

```env
SCHEDULER_ENABLED=true
SCHEDULER_QUEUE_INTERVAL_MS=3000
SCHEDULER_COMPLETION_INTERVAL_MS=3000
SCHEDULER_MAX_SIMULATED_RUNTIME_MS=30000
SCHEDULER_FAILURE_RATE=0.1
```

For deterministic testing, set:

```env
SCHEDULER_FAILURE_RATE=0
SCHEDULER_MAX_SIMULATED_RUNTIME_MS=5000
```

That makes jobs complete successfully and caps simulated runtime at 5 seconds.

## New endpoints

Protected endpoint:

```http
GET /api/scheduler/status
```

Admin-only manual scheduler trigger:

```http
POST /api/scheduler/tick
```

## Slurm-inspired API mapping

| Slurm idea | ClusterOps API |
|---|---|
| `sbatch` | `POST /api/jobs` |
| `squeue` | `GET /api/jobs` |
| `scancel` | `PATCH /api/jobs/:id/cancel` |
| `sinfo` | `GET /api/nodes` |

## Test flow

1. Start backend.
2. Create/login admin.
3. Create an online node.
4. Submit a job with `estimatedRuntimeSeconds: 5`.
5. Check jobs immediately. It should become `running` within a few seconds.
6. Check jobs again after a few seconds. It should become `completed`.
7. Check nodes. Resources should be released.
8. Check metrics. Completed count should increase.
