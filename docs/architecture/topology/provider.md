# Topology — Provider

## Scope

This page describes provider chain topology for translation operations.

## Provider topology

- Provider catalog defines supported backends and required credentials.
- Translation config chooses primary/eligible providers and rate-limit profiles.
- Routing behavior determines retry/fallback across provider order.
- Provider attempts and winner/fallback summaries are emitted per target.

## Operational boundaries

- Credential handling: readiness checks before translator construction.
- Rate/parallel controls: provider caps and effective workers.
- Health/failure handling: retryability classification and fallback decisions.

## Current vs planned

- **Current:** provider-order/rate-limit decisions are split across host helpers and core seams.
- **Planned:** unified resolver behavior in core with additive warning output and consistent chain eligibility.

Core architecture migration is **shipped** — resolver behavior lives in core.
