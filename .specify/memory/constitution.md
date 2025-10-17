
# Content Hub Manager Constitution

## Core Principles

### I. Platform-Agnostic Unified Dashboard

- Provide a single, consistent UI to manage platform-specific assets for Twitch, TikTok, YouTube, and Instagram.
- Encapsulate platform differences behind adapter contracts; users switch platforms without context loss.
- Maintain parity of core actions across platforms: browse, upload, preview, organize, and checklist verification.

### II. Asset-Centric Information Architecture

- Treat assets as first-class entities: videos, images, overlays, thumbnails, scene files, captions, descriptions.
- Support versioning, folder-based organization, tags, and saved filters; enable fast search and de-duplication.
- Maintain platform-aware metadata schemas (e.g., title length, aspect ratio, hashtags) with validation rules.
- Allow pre-publication checklists per platform;

### III. Test-First and Contract-Driven

- Tests precede implementation (Red-Green-Refactor); unit, integration, and e2e suites are mandatory.
- Define clear API and adapter contracts using JSON Schema/OpenAPI; enforce with contract tests and mocks.
- Include deterministic e2e scenarios for: upload, preview, folder operations, checklist gating, and platform switch.

### IV. Observability, Versioning, and Simplicity

- Provide structured logging, tracing, and metrics for uploads, previews, checklist results, and publish attempts.
- Follow semantic versioning; document breaking changes and migration paths for adapters and APIs.
- Favor simple solutions first; feature-flag risky changes; define SLOs for latency, reliability, and UX responsiveness.

## Additional Constraints & Product Requirements

- **Users & Roles**: Creator, Editor, Admin with role-based access control.
- **Platforms (v1)**: Twitch, TikTok, YouTube, Instagram via adapters; easy extension to new platforms.
- **Asset Management**:
  - Upload from device or import from URL/cloud; supported types: video, image, audio, text/caption, scene/overlay files.
  - Folder hierarchy, tags, bulk actions, drag-and-drop, duplicate detection, and safe rename/move.
  - Previews: image thumbnails, video scrub/playback, audio waveform, overlay/scene viewer where feasible.
- **Metadata & Validation**:
  - Platform-specific fields with inline validation (e.g., title length, aspect ratio, duration caps, caption presence).
  - Templated descriptions/hashtags; reusable presets; auto-fill from previous versions/drafts.
- **Checklists (Pre-Live/Pre-Publish)**:
  - Per-platform checklist templates (editable by Admin) with required/optional items.
  - Gate go-live/publish until required items pass; show blockers and quick-fix links.
- **Performance & Reliability**:
  - Large-file uploads with resumable, chunked transfer; background processing and progress reporting.
  - Target p95 UI action latency <300ms (non-upload), upload throughput limited by network/infra.
- **Internationalization & Accessibility**: i18n-ready strings; WCAG-compliant UI controls and keyboard navigation.
- **Data Management**: Configurable retention for derived artifacts; object storage for assets; CDN for previews.
- **Resilience**: Graceful degradation when a platform API is down; queue-based retries and user-facing status.

## Development Workflow & Quality Gates

- **Branching & Reviews**: Trunk-based with short-lived feature branches; at least 1 peer review per PR.
- **CI Gates**: Lint, type check, unit tests, integration tests, e2e smoke; min 80% coverage on changed lines.
- **Security & Quality**: SAST/dependency scanning; secret detection; accessibility and performance checks in CI.
- **Releases**: Semantic versioning; changelogs; blue/green or canary deployments; rollbacks under 10 minutes.
- **Documentation**: Updated API/adapter contracts, user guides for checklist templates, and runbooks for incidents.

## Governance

- This constitution supersedes ad-hoc practices; deviations require a documented exception and time-bound plan.
- Amendments require: written proposal, impact analysis, migration strategy, and approval from maintainers.
- All PRs must attest compliance with Core Principles and Quality Gates; CI enforces non-negotiable checks.
- Adapter contracts are versioned; breaking changes require deprecation policy and dual-support where feasible.

**Version**: 1.0.0 | **Ratified**: 2025-10-16 | **Last Amended**: 2025-10-16
