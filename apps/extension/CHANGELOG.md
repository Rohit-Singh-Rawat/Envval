# Change Log

All notable changes to the "Envval-ext" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Upcoming features and fixes will be documented here.

## [1.0.36] - 2026-02-24

### Added

- Feature for environment file naming, prompt-ignore store, and webview support.
- Centralized `EnvCacheService` for environment variable caching.
- Real-time environment explorer tree and state detection.
- Sync manager, operation queue, and connection monitor for resilient offline support.
- Support for monorepo file paths and path validation utilities.
- Device authentication flow and API client refresh token support.
- Async key derivation and encryption secrets management.

### Changed

- Refactored and hardened sync manager and status bar for production standards.
- Updated services to use server-generated IDs.
- Cleaned up code, simplified file patterns, and standardized imports.
- Streamlined extension README documentation to focus on core capabilities.

### Fixed

- File URI resolution in tracked environments view.
- Tree UI rendering improvements.
- Various lint warnings and extension bugs.
