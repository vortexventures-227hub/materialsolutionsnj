# David Memory Staging Monitoring Plan

Scope: this plan applies only after Patch approves the SQL/RLS migration and a staging environment explicitly enables `DAVID_MEMORY_ENABLED=true`. Writes remain separately gated by `DAVID_MEMORY_WRITE_ENABLED=true`; production stays off until Patch/Chris approve promotion.

## Metrics and thresholds

- **Write success rate**: track attempted `persistMemory` calls vs successful Supabase inserts. Staging threshold: page/operator alert if success rate drops below 99% over 15 minutes, or any 5xx Supabase write error repeats more than 3 times in 10 minutes.
- **Retrieve latency p50/p95**: track `retrieveMemoryBrief` duration around the Supabase query filtered by `identity_key` and ordered by `updated_at DESC`. Staging threshold: p50 under 150 ms and p95 under 500 ms; alert if p95 exceeds 750 ms for two consecutive 10-minute windows.
- **PII-redaction hit rate**: every memory write receipt/log line should include only SHA-256/12 fingerprints and zero raw phone/email/name/company strings. Threshold: 100% redacted; any raw-PII detector hit is an immediate stop/disable event.
- **Error rate**: track retrieve/persist exceptions and safe-fallback returns. Threshold: alert if memory-layer error rate exceeds 1% over 15 minutes or if a single request bubbles a memory exception into the David chat response.

## Where metrics surface

- **Vercel logs**: structured David chat handler events (`david_memory.retrieve`, `david_memory.persist`, `david_memory.fallback`) with request id, backend name, elapsed ms, redacted identity fingerprint, and success/failure status.
- **Supabase logs**: Postgres query/error logs for `public.david_memory`, RLS denials, insert/update counts, and slow query samples on `david_memory_identity_updated_at_idx`.
- **Telegram/operator alert**: watchdog summary posts to the existing operator channel when any threshold trips, including the feature flag state and a rollback instruction to set `DAVID_MEMORY_ENABLED=false` and `DAVID_MEMORY_WRITE_ENABLED=false`.

## Rollback / disable gate

If any threshold is breached in staging, disable memory with env flags first (`DAVID_MEMORY_ENABLED=false`, `DAVID_MEMORY_WRITE_ENABLED=false`), then preserve Vercel/Supabase logs for review. Do not enable production writes until staging shows a clean monitoring window and Patch explicitly files GO.
