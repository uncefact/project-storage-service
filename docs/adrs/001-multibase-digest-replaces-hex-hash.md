# ADR: digestMultibase replaces hex hash as the content-integrity field

- **Date:** 2026-05-19
- **Status:** accepted

## Context

Through 3.2.x, every store response carried a hex SHA-256 `hash` field as the content-integrity value. The hex form carries digest bytes only; the algorithm (SHA-256) and the encoding (lowercase hex) have to be communicated out of band. A consumer verifying integrity must already know, by contract, both of those facts. If we ever change algorithm, every consumer needs a coordinated update.

The wider content-integrity ecosystem has converged on self-describing digest formats. A multibase-encoded multihash carries the algorithm identifier (as a multihash code), the digest length, and the digest bytes, all wrapped in a multibase string-encoding that identifies the base used. A consumer reading a multibase-encoded multihash value can decode it and verify content integrity without any out-of-band metadata.

In parallel with this work, a shared utility primitive shipped in `@uncefact/untp-utils@0.1.0` (see tests-untp ADR 003): `MultibaseDigest.fromData(...)`. The primitive standardises the algorithm choice (sha2-256), the multibase variant (base58btc), and the encoded shape, so multiple downstream products can adopt the same digest convention without each making its own algorithm or encoding choices.

A decision is needed: continue emitting hex SHA-256, emit both forms transitionally, or replace the hex form with a multibase-encoded multihash sourced from the shared utility.

## Decision

Replace the hex `hash` field with `digestMultibase` (a multibase-encoded multihash). Digest computation goes through `@uncefact/untp-utils` `MultibaseDigest.fromData(...)`, so the algorithm and multibase choices are owned by the shared utility and not duplicated per consumer.

The hex `hash` field is removed in the 4.0.0 release. There is no overlap release that returns both fields.

## Consequences

**What becomes easier:**

- Consumers can verify the digest from the value alone. The algorithm identifier and the encoding are recoverable from the `digestMultibase` value, so no out-of-band metadata is required to interpret it.
- The storage service aligns with how content integrity is typically expressed in the wider ecosystem. Consumers that already speak that vocabulary need no special-case handling for our digests.
- Future algorithm or encoding evolution happens once in `@uncefact/untp-utils`, not in every product that emits a digest.

**What becomes more difficult:**

- 4.0.0 is a breaking change for any consumer that reads `response.hash`. Consumers must be updated in lockstep with the URL path change (ADR 002).
- Downstream systems that still require a hex SHA-256 must decode the multibase digest themselves (documented in the 4.0.0 migration guide). This is mechanical but adds a small amount of consumer-side code.
- The storage service now has a runtime dependency on `@uncefact/untp-utils`. Version churn in that package can ripple in.

## Alternatives Considered

### Keep emitting hex `hash` only

Rejected. The hex form needs out-of-band metadata to interpret, ties consumers to a fixed algorithm, and is increasingly out of step with how content integrity is expressed across the ecosystems the storage service is meant to interoperate with.

### Emit both `hash` and `digestMultibase` for a transitional release

Rejected. Two fields encoding the same digest forces every consumer to choose, splits the consumer population during the transition, and extends rather than shortens the deprecation cycle. A clean major-version cut is simpler to communicate and migrate against, and the migration mechanics are well understood (clients flip a single field reference).

### Compute the digest inside the storage service rather than via `@uncefact/untp-utils`

Rejected. The same primitive is needed across multiple downstream products. Duplicating the algorithm and encoding choices in each consumer creates drift risk; centralising in `@uncefact/untp-utils` keeps the choices coherent across products without each having to track the others.

## References

- #111 (PR replacing hex hash with `digestMultibase`)
- tests-untp ADR 003 (`@uncefact/untp-utils` package)
- `@uncefact/untp-utils@0.1.0`
- [Multihash specification](https://github.com/multiformats/multihash)
- [Multibase specification](https://github.com/multiformats/multibase)
- `documentation/docs/migration-guides/migrating-to-4.md`
