import Lake
open Lake DSL

package agl72_verify where
  leanOptions := #[
    ⟨`autoImplicit, false⟩
  ]

require mathlib from git
  "https://github.com/leanprover-community/mathlib4.git" @ "v4.7.0"

@[default_target]
lean_lib AGL72 where
  globs := #[.submodules `AGL72]
