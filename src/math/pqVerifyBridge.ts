/**
 * pq-verify Bridge & Formal Verification Artifact Generator
 * Generates:
 *   1. agl72_constants.h (C constants, LUTs, and GF2P8 immediate)
 *   2. agl72_harness.c (CBMC verification harness with NTT loop invariants)
 *   3. agl72_proof.lean (Lean 4 theorems, kernel-checked when built)
 *   4. pq-verify.json (a manifest; pq-verify itself reads no config file)
 */

import JSZip from 'jszip';
import { BitMatrix7 } from '../types/crypto';
import { invertMat7, mulVec7, popcount7 } from './algebra';
import { computeNibbleLUTs, encodeGF2P8AffineConstant } from './egraphSimd';
import { computePermutation256 } from './butterfly';
import { generateLean4Source } from './lean4Proofs';

export interface PqVerifyArtifacts {
  constantsHeader: string;
  cbmcHarness: string;
  lean4Proof: string;
  configJson: string;
  readmeAudit: string;
}

export function generatePqVerifyArtifacts(
  matrix: BitMatrix7,
  displacementK = 0x01
): PqVerifyArtifacts {
  const inv = invertMat7(matrix);
  const invMat = inv.inverse || matrix;
  const { lutLow, lutHigh } = computeNibbleLUTs(matrix, displacementK);
  const gf2p8Imm = encodeGF2P8AffineConstant(matrix);
  const perm256 = computePermutation256(matrix, displacementK);
  let branchNumber = Infinity;
  for (let b = 1; b < 128; b++) {
    const s = popcount7(b) + popcount7(mulVec7(matrix, b));
    if (s < branchNumber) branchNumber = s;
  }
  const lean4Code = generateLean4Source(matrix, displacementK);

  const formatHexArray = (arr: number[], perLine = 16) => {
    const lines: string[] = [];
    for (let i = 0; i < arr.length; i += perLine) {
      const slice = arr.slice(i, i + perLine);
      lines.push('    ' + slice.map((x) => `0x${x.toString(16).padStart(2, '0')}`).join(', '));
    }
    return lines.join(',\n');
  };

  // 1. agl72_constants.h
  const constantsHeader = `/**
 * @file agl72_constants.h
 * @brief Auto-generated AGL(7,2) Structural Layer Hardware Constants for NTT Butterfly
 * Exported for pq-verify and hardware compilation
 * Invariants claimed below are checked by agl72_harness.c (CBMC) and agl72_proof.lean (Lean)
 */

#ifndef AGL72_CONSTANTS_H
#define AGL72_CONSTANTS_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define AGL72_DIMENSION 7
#define AGL72_DISPLACEMENT_K 0x${displacementK.toString(16).padStart(2, '0')}
#define AGL72_BRANCH_NUMBER 4 /* required; agl72_harness.c checks L meets it */
#define AGL72_GF2P8_IMM64 ${gf2p8Imm}

/** Matrix L in GL(7,2) (row-major 7-bit values) */
static const uint8_t AGL72_MATRIX_L[7] = {
    ${matrix.map((r) => `0x${r.toString(16).padStart(2, '0')}`).join(', ')}
};

/** Constructive inverse matrix L⁻¹ in GL(7,2) */
static const uint8_t AGL72_MATRIX_L_INV[7] = {
    ${invMat.map((r) => `0x${r.toString(16).padStart(2, '0')}`).join(', ')}
};

/** E-Graph synthesized 16-byte nibble tables for AVX2 and ARM NEON */
static const uint8_t AGL72_LUT_LOW_K[16] __attribute__((aligned(16))) = {
    ${lutLow.map((v) => `0x${v.toString(16).padStart(2, '0')}`).join(', ')}
};

static const uint8_t AGL72_LUT_HIGH[16] __attribute__((aligned(16))) = {
    ${lutHigh.map((v) => `0x${v.toString(16).padStart(2, '0')}`).join(', ')}
};

/** Deterministic AGL(7,2) 256-point NTT Permutation Table */
static const uint8_t AGL72_PERM_256[256] __attribute__((aligned(64))) = {
${formatHexArray(perm256, 16)}
};

#ifdef __cplusplus
}
#endif

#endif /* AGL72_CONSTANTS_H */
`;

  // 2. agl72_harness.c (CBMC harness)
  const cbmcHarness = `/**
 * @file agl72_harness.c
 * @brief CBMC Formal Verification Harness for AGL(7,2) NTT Butterfly Reordering
 * Automated bounded model checking for pq-verify pipeline
 * Verifies:
 *   1. Bit-level invertibility: L * L⁻¹ == Identity
 *   2. Global branch number: ∀b ≠ 0, wt(b) + wt(L*b) ≥ 4
 *   3. Zero fixed points: ∀b, (L*b) ⊕ k ≠ b
 *   4. Memory safety and loop invariant compliance for 256-point NTT inner loop
 */

#include "agl72_constants.h"
#include <assert.h>
#include <stdbool.h>
#include <stdint.h>

/* Helper: Population count for 7-bit values */
static inline uint32_t popcount7(uint8_t x) {
    x = x & 0x7F;
    uint32_t c = 0;
    while (x > 0) {
        c += (x & 1);
        x >>= 1;
    }
    return c;
}

/* Helper: Matrix-vector multiplication in GF(2) */
static inline uint8_t mul_vec7(const uint8_t M[7], uint8_t b) {
    uint8_t y = 0;
    for (int r = 0; r < 7; r++) {
        uint32_t parity = popcount7(M[r] & b) % 2;
        if (parity == 1) {
            y |= (1 << r);
        }
    }
    return y;
}

/**
 * Invariant 1: CBMC Invertibility Check
 * Proves that L is injective and bijectively inverted by L_INV
 */
void check_cbmc_invertibility(void) {
    for (uint32_t b = 0; b < 128; b++) {
        uint8_t forward = mul_vec7(AGL72_MATRIX_L, (uint8_t)b);
        uint8_t recovered = mul_vec7(AGL72_MATRIX_L_INV, forward);
        __CPROVER_assert(recovered == (uint8_t)b, "CBMC_ASSERT: L * L_INV == Identity");
    }
}

/**
 * Invariant 2: CBMC Global Branch Number Invariant
 * Proves B(L) ≥ 4 across all 127 non-zero inputs
 */
void check_cbmc_branch_number(void) {
    for (uint32_t b = 1; b < 128; b++) {
        uint8_t mapped = mul_vec7(AGL72_MATRIX_L, (uint8_t)b);
        uint32_t sum_wt = popcount7((uint8_t)b) + popcount7(mapped);
        __CPROVER_assert(sum_wt >= AGL72_BRANCH_NUMBER, "CBMC_ASSERT: wt(b) + wt(Lb) >= 4");
    }
}

/**
 * Invariant 3: CBMC Zero Fixed Points Invariant
 * Proves k ∉ im(L ⊕ I) preventing any in-place permutation collisions
 */
void check_cbmc_zero_fixed_points(void) {
    for (uint32_t b = 0; b < 128; b++) {
        uint8_t affine_mapped = mul_vec7(AGL72_MATRIX_L, (uint8_t)b) ^ AGL72_DISPLACEMENT_K;
        __CPROVER_assert(affine_mapped != (uint8_t)b, "CBMC_ASSERT: Zero fixed points f(b) != b");
    }
}

/**
 * Invariant 4: CBMC NTT Butterfly Buffer Bounds & Loop Safety
 * Proves 256-point NTT reordering indices are strictly within [0..255] and bijective
 */
void check_cbmc_ntt_butterfly_bounds(void) {
    bool seen[256];
    for (int i = 0; i < 256; i++) {
        seen[i] = false;
    }

    for (uint32_t x = 0; x < 256; x++) {
        uint8_t dest = AGL72_PERM_256[x];
        __CPROVER_assert(dest < 256, "CBMC_ASSERT: NTT index within [0..255]");
        __CPROVER_assert(!seen[dest], "CBMC_ASSERT: Bijective bijection (no duplicate index)");
        seen[dest] = true;
    }
}

int main(void) {
    check_cbmc_invertibility();
    check_cbmc_branch_number();
    check_cbmc_zero_fixed_points();
    check_cbmc_ntt_butterfly_bounds();
    return 0;
}
`;

  // 3. pq-verify.json: a manifest of this bundle. pq-verify reads no config
  // file; the invariants below are computed here and checked by the harness
  // (CBMC) and the Lean file, not by pq-verify.
  let fixedPoints = 0;
  for (let b = 0; b < 128; b++) {
    if ((mulVec7(matrix, b) ^ displacementK) === b) fixedPoints++;
  }
  const configJson = JSON.stringify(
    {
      project: 'AGL(7,2) structural layer bundle',
      note: 'Manifest only. pq-verify has no config-file input; run the commands in README_AUDIT.md.',
      constants_header: 'agl72_constants.h',
      cbmc_harness: 'agl72_harness.c',
      formal_proof: 'agl72_proof.lean',
      invariants_computed: {
        field: 'F_2^7',
        dimension: 7,
        invertible: inv.isInvertible,
        rank: inv.rank,
        branch_number: branchNumber,
        displacement_k: `0x${displacementK.toString(16).padStart(2, '0')}`,
        fixed_points: fixedPoints,
        ntt_points: 256,
      },
      checked: 'no: build agl72_proof.lean with Lean and run the CBMC harness',
    },
    null,
    2
  );

  // 4. README_AUDIT.md
  const readmeAudit = `# AGL(7,2) structural layer: verification bundle

Generated by the g2the7 workbench for L = [${matrix.map((r) => `0x${r.toString(16).padStart(2, '0')}`).join(', ')}], k = 0x${displacementK.toString(16).padStart(2, '0')}.
Nothing in this bundle has been checked yet; the two commands below check it.

## Files
- \`agl72_constants.h\`: L, L⁻¹, the GF2P8 immediate (\`${gf2p8Imm}\`), nibble tables and the 256-point permutation.
- \`agl72_harness.c\`: a CBMC harness asserting L⁻¹·L = I, wt(b) + wt(L·b) ≥ AGL72_BRANCH_NUMBER for b ≠ 0, no fixed points of f, and that the 256-point permutation is a bijection.
- \`agl72_proof.lean\`: Lean 4 theorems for this L and k, each closed by \`decide\` (kernel-checked; no \`native_decide\`, no \`sorry\`, no Mathlib). For the canonical L it is the same file g2the7's CI builds.
- \`pq-verify.json\`: a manifest of the above with the invariants as computed by the workbench.

## Checking it
\`\`\`bash
lean agl72_proof.lean                          # Lean 4.7.0; exits 0 only if every theorem checks
cbmc agl72_harness.c --unwind 257 --bounds-check --unwinding-assertions
\`\`\`

## pq-verify
pq-verify does not consume this bundle. Its \`--audit-source DIR\` mode runs
CBMC over an ML-KEM or ML-DSA C source tree, not over arbitrary headers or
Lean files. Use the two commands above for this layer, and pq-verify for the
PQ scheme it is embedded in.
`;

  return {
    constantsHeader,
    cbmcHarness,
    lean4Proof: lean4Code,
    configJson,
    readmeAudit,
  };
}

/**
 * Bundles all 4 artifacts into a downloadable ZIP file using JSZip
 */
export async function exportPqVerifyZip(
  matrix: BitMatrix7,
  displacementK = 0x01
): Promise<Blob> {
  const artifacts = generatePqVerifyArtifacts(matrix, displacementK);
  const zip = new JSZip();

  zip.file('agl72_constants.h', artifacts.constantsHeader);
  zip.file('agl72_harness.c', artifacts.cbmcHarness);
  zip.file('agl72_proof.lean', artifacts.lean4Proof);
  zip.file('pq-verify.json', artifacts.configJson);
  zip.file('README_AUDIT.md', artifacts.readmeAudit);

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
