# SDK operations

Use SDK run entries to execute command-equivalent workflows in your own host.

## Runtime-neutral core

The SDK core logic is runtime-agnostic. Runtime adapters provide environment capabilities for Node, Web, and Edge.

## Progress note

Translation progress behavior is documented under:

- [generate](../commands/generate.md)

SDK consumers should treat progress as host-owned UX while preserving operation semantics and result contracts.
