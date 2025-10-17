```markdown
# Research: 001-content-platform-dashboard

## Purpose

Resolve technical unknowns and document decisions for the MVP: stack choices, upload strategy, search approach, storage layout, and e2e tooling.


## Open Questions (NEEDS CLARIFICATION)

- Preferred backend framework (Express vs Fastify vs other) — CHOSEN: Fastify (confirmed by product).  
- Preferred e2e tool (Playwright vs Cypress) — CHOSEN: Playwright (confirmed by product).  
- Expected dataset sizes for search optimization (number of assets per user) — DECIDED: target up to 1,000 assets/user for instant client-side indexing, design to gracefully handle up to 5,000 assets/user with server-side fallback.  
- Resumable upload protocol — CHOSEN: tus protocol (tus.io) for standard, reliable resumable uploads and wide client/server library support.


## Research Tasks

1. Decision: Backend framework
2. Decision: e2e tooling
3. Decision: resumable upload protocol (tus, multipart chunking, custom)
4. Decision: real-time search approach (local indexing vs server-side websocket updates)
5. Storage layout: SQLite schema and object storage mapping


## Decisions

- Decision: Backend framework = Fastify
	- Rationale: Lightweight, high-performance Node.js framework with a strong plugin ecosystem, good TypeScript support and low overhead for MVP. Matches project goals of quick delivery with production-grade performance.
	- Alternatives considered: Express (more ubiquitous but slightly heavier and more middleware boilerplate); NestJS (opinionated, more upfront cost).

- Decision: E2E tooling = Playwright
	- Rationale: Cross-browser support including Chromium, Firefox and WebKit; reliable automation API; good CI integration and parallelization; preferred for cross-browser testing of responsive UI.
	- Alternatives considered: Cypress (excellent developer experience but limited cross-browser parity for WebKit in older versions).

- Decision: Expected dataset sizes = 1,000 assets/user (design for up to 5,000)
	- Rationale: For most creators, working sets are in the low thousands; client-side indexing (Lunr/Fuse) provides instant filtering for ~1k items. Designing to scale to ~5k with server-side indexing/search avoids rework.
	- Alternatives considered: Server-only indexing (more robust for very large datasets but higher infra cost); hybrid approach chosen.

- Decision: Resumable upload = tus protocol
	- Rationale: tus is an open, battle-tested protocol with client/server libraries (tus-js-client, tus-node-server) that handles resumable/paused uploads, retries and partial uploads. Reduces implementation risk vs custom chunking.
	- Alternatives considered: Custom chunked multipart uploads (more control but more implementation and edge cases), direct S3 multipart (works for S3-specific deployments but less general for adapter model).

- Decision: Real-time search approach = client-side indexing with server-side fallback + websocket updates
	- Rationale: Client-side indexing provides immediate, low-latency filtering for typical per-user datasets (<=1k). For larger queries or shared/workspace search, a server-side endpoint (SQLite FTS or small search service) will be used. Websocket or Server-Sent Events provide timely updates when assets change.
	- Alternatives considered: Pure server-side search (safer at scale) and third-party search services (Algolia) — deferred for MVP to reduce cost/complexity.

## Research outcomes

- All pending NEEDS CLARIFICATION items resolved; choices recorded above. Phase 0 complete.


``` 
