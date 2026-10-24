# AGL(7,2) Cryptographic Workbench & Autoformalization Platform

A precision mathematical research workbench and code generation platform for verifying, optimizing, and hardware-synthesizing non-heuristic $\text{AGL}(7,2)$ structural layers for 256-point Number Theoretic Transforms (NTTs) and cryptographic diffusion.

### User Review & Critical Decisions

> [!IMPORTANT]
> The architectural direction and scope have been aligned via the Phase 1 clarification interview:
> - **Primary Workflow**: Full cryptographic workbench integrating all three pillars—machine-checked Lean 4 formal verification, reinforcement learning finite group conjugacy search, and E-graph SIMD code synthesis.
> - **Target Instruction Sets**: Multi-target codegen supporting x86-64 AVX2, x86-64 AVX-512 (`GF2P8AFFINEQB` and vector byte shuffles), ARM NEON, WebAssembly SIMD128, and CUDA PTX warp kernels.
> - **Visualization Paradigm**: Interactive 7-layer butterfly lattice graph, differential diffusion heatmaps across 128 inputs / 7 stages, and an interactive Lean 4 tactic & goal-state inspector.

---

### 1. Overview & Core Concept

- **What It Does**: Provides an end-to-end interactive mathematical environment for exploring, verifying, and deploying a non-heuristic cryptographic permutation over $\mathbb{F}_2^7$ with affine shift $k = 0x01$, branch number $B(L) = 4$, zero fixed points ($k \notin \text{im}(L \oplus I)$), and deterministic butterfly permutations for $n = 256$ NTT architectures.
- **Target Audience / Persona**: Cryptographic engineers, post-quantum cryptography researchers (lattice-based schemes like ML-KEM/Dilithium NTT speedups), formal methods practitioners (Lean 4), and high-performance computing (SIMD/compiler) architects.
- **Key Value**: Bridges pure algebraic formal verification (Lean 4 type theory), automated optimization (RL over $\text{AGL}(7,2)$ conjugacy orbits), and hardware-level performance (zero-stall E-graph SIMD vectorization) in a unified, mathematically rigorous workbench.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Structural Matrix & Invariant Inspector**:
     - Interactive matrix editor for $L \in \text{GL}(7,2)$ and displacement vector $k \in \mathbb{F}_2^7$.
     - Live algebraic engine computing rank, determinant in $\mathbb{F}_2$, image subspace $\text{im}(L \oplus I)$, branch number $B(L) = \min_{b \ne 0}(\text{wt}(b) + \text{wt}(Lb))$, and fixed-point verification.
     - Interactive 7-stage Butterfly Lattice visualizer displaying signal paths for all 256 butterfly indices.
  2. **Lean 4 Autoformalization & Goal Inspector**:
     - Complete Lean 4 formalization of the $\text{AGL}(7,2)$ structural layer.
     - Theorem proofs for: (1) Invertibility of $L$, (2) Branch number $B(L) = 4$ across all 127 non-zero inputs, (3) Set non-membership $k \notin \text{im}(L \oplus I)$ proving no fixed points exist.
     - Interactive tactic explorer: step through proof lines, inspect the Lean goal state (`⊢ k ∉ im (L + I)`), and view proof terms and machine-checked audit stamps.
  3. **Reinforcement Learning Conjugacy Explorer**:
     - Search across the conjugacy orbit $L' = P L P^{-1}$ within $\text{AGL}(7,2)$ under hard invariant barriers ($B(L') = 4$, zero fixed points).
     - Live agent search simulation: reward curve, Pareto frontier (differential diffusion vs. local clustering metric), and differential propagation probability table.
     - Differential diffusion heatmap visualizer across the 7 butterfly stages, highlighting optimal diffusion profiles.
  4. **E-Graph & Multi-Target SIMD Synthesizer**:
     - E-graph equality saturation visualizer: shows rewrite rule passes, AST simplification, and node count compression.
     - Real-time multi-target code generation with syntax highlighting:
       - **x86-64 AVX2**: `_mm256_shuffle_epi8` & bit-matrix slicing.
       - **x86-64 AVX-512**: `_mm512_gf2p8affine_epi64_epi8` hardware affine transform + permutation.
       - **ARM NEON**: `vtbl2_u8` & bitwise vector registers.
       - **WebAssembly SIMD128**: `i8x16.swizzle` portable high-throughput kernels.
       - **CUDA**: `__byte_perm` warp-shuffle butterfly routines.
     - Built-in test vector validation verifying identical bit outputs between high-level math and vector intrinsics.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Precision Laboratory & Cryptographic Workbench (following `references/8_science_space_biotech.md`). Clean technical dark/slate atmosphere with obsidian background (`#07090E`), crisp slate structural panels (`#0F131D`), hairline borders (`#1E2638`), and calibrated phosphor cyan accents (`#06B6D4` / `#22D3EE`).
  - *Typography*: Technical neo-grotesque (`Plus Jakarta Sans` / `IBM Plex Sans`) for prose and headers; strict tabular monospace (`font-mono tabular-nums`) for matrices, bitvectors, Lean code, and assembly.
  - *Discipline*: Strict anti-slop rules—no generic pill badges, no fake vanity meters, no comment-syntax headers (`//`), no decorative pulsing dots. Every metric represents real mathematical calculations on $\mathbb{F}_2^7$.

---

### 3. Key Product Decisions & Trade-Offs

- **Exact Client-Side Algebraic Engine**:
  - *Chosen Approach*: Implement full finite field arithmetic over $\mathbb{F}_2$, Gaussian elimination, rank calculation, and branch number enumeration in high-performance TypeScript.
  - *Why*: Instant $<5\text{ms}$ live updates when tweaking matrices or stepping through permutations, zero latency, runs entirely hermetic without external server dependencies.
- **Complete, Valid Lean 4 Formalizations**:
  - *Chosen Approach*: Provide complete, syntactically authentic Lean 4 files with actual Mathlib-aligned structures (`Matrix (Fin 7) (Fin 7) (ZMod 2)`), verifiable tactics (`decide`, `fin_cases`, `rfl`, `native_decide`), and interactive goal state stepping.
  - *Why*: Real educational and research value for post-quantum cryptographers autoformalizing theorems in interactive theorem provers.
- **E-Graph Rewrite Engine & Bit-Matrix Codegen**:
  - *Chosen Approach*: Implement a deterministic e-graph saturation model demonstrating tree rewrites from bit-extraction $\rightarrow$ lookup tables $\rightarrow$ hardware affine matrix instructions (`GF2P8AFFINEQB`) and vector byte shuffles.
  - *Why*: Direct practical bridge from cryptographic theory to low-level assembly and high-throughput production implementations.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Top Navigation & Workspace Header                     │
│  [AGL(7,2) Cryptographic Workbench] — [Overview, Matrix, Lean 4, RL, SIMD]  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
           ┌───────────────────────────┴───────────────────────────┐
           ▼                                                       ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│     Global State & Algebra Engine    │  │    Cryptographic Invariants HUD   │
│ - Matrix L ∈ GL(7,2) (7x7 bit matrix)│  │ - Invertible: det(L) = 1 (Rank 7) │
│ - Shift vector k ∈ F_2^7 (0x01)      │  │ - Branch Number B(L) = 4 (127/127)│
│ - Butterfly permutation (n = 256)    │  │ - Zero Fixed Points: k ∉ im(L⊕I)  │
└──────────────────┬───────────────────┘  └─────────────────┬─────────────────┘
                   │                                        │
     ┌─────────────┴───────────────────┬────────────────────┴────────────┐
     ▼                                 ▼                                 ▼
┌──────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────┐
│   Pillar 1: Lean 4 Lab   │  │ Pillar 2: RL Explorer    │  │ Pillar 3: SIMD Codegen   │
│ - Full Lean 4 Source     │  │ - Conjugacy Search P L P │  │ - Multi-target Gen:      │
│ - Interactive Proof Tree │  │ - Reward & Pareto Graph  │  │   AVX2, AVX512, NEON,     │
│ - Goal State Inspector   │  │ - 7-Stage Diffusion Map  │  │   WASM SIMD, CUDA        │
│ - Invariant Audit Stamp  │  │ - Clustering Analyzer    │  │ - E-Graph Rewrite Graph  │
│ - One-click Lean Export  │  │ - Candidate Comparison   │  │ - Live Test Vector Check │
└──────────────────────────┘  └──────────────────────────┘  └──────────────────────────┘
```

- **Interactive State Model**:
  - `matrixL`: 7-element array of 7-bit integers representing $L \in \text{GL}(7,2)$.
  - `vectorK`: 7-bit integer representing $k \in \mathbb{F}_2^7$ (default `0x01`).
  - `activeTab`: `'workbench' | 'lean4' | 'rl_search' | 'simd_codegen' | 'butterfly'`.
  - `rlState`: Active candidate matrices, Pareto frontier points, reward curves, and diffusion heatmaps.
  - `codegenTarget`: `'avx2' | 'avx512' | 'neon' | 'wasm' | 'cuda'`.
  - `proofStepIndex`: Current active tactic and goal state in Lean 4 proof inspector.

- **Verification Strategy**:
  - Zero compilation errors in TypeScript/React (`compile_applet`).
  - Verified algebraic consistency: all 127 non-zero inputs checked for branch number $B(L) \ge 4$, Gaussian elimination confirming $\text{dim}(\text{im}(L \oplus I)) < 7$ and $k \notin \text{im}(L \oplus I)$.
  - Bit-exact vector test vectors verifying that high-level affine mapping matches simulated SIMD output across all 256 inputs.
