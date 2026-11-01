import Lake
open Lake DSL

-- No dependencies: the proofs use only Lean core, so `lake build` needs
-- no Mathlib download.
package agl72_verify

@[default_target]
lean_lib AGL72 where
  roots := #[`agl72_proof]
