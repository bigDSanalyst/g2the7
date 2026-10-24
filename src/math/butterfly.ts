/**
 * 256-Point NTT Butterfly Architecture & AGL(7,2) Deterministic Reordering
 */

import { BitMatrix7, BitVector7 } from '../types/crypto';
import { mulVec7, popcount7 } from './algebra';

/**
 * Maps 7-bit address b in F_2^7 via f(b) = (L * b) ^ k
 */
export function mapAGL7(M: BitMatrix7, k: BitVector7, b: BitVector7): BitVector7 {
  return mulVec7(M, b & 0x7f) ^ (k & 0x7f);
}

/**
 * Computes deterministic AGL(7,2) reordering for 256-point NTT:
 * Address x = h * 128 + b, where h in {0,1} and b in F_2^7.
 * pi(x) = (h << 7) | ((L * b) ^ k)
 */
export function computePermutation256(M: BitMatrix7, k: BitVector7): number[] {
  const perm: number[] = new Array(256);
  for (let x = 0; x < 256; x++) {
    const high = (x >> 7) & 1;
    const low = x & 0x7f;
    const mappedLow = mapAGL7(M, k, low);
    perm[x] = (high << 7) | mappedLow;
  }
  return perm;
}

/**
 * Computes the 128-element AGL(7,2) permutation
 */
export function computePermutation128(M: BitMatrix7, k: BitVector7): number[] {
  const perm: number[] = new Array(128);
  for (let b = 0; b < 128; b++) {
    perm[b] = mapAGL7(M, k, b);
  }
  return perm;
}

/**
 * Measures differential diffusion across the 7 butterfly stages.
 * For each stage s in [0..6], computes the percentage of active butterfly lanes
 * reached from a single active input bit difference.
 */
export function computeStageDiffusions(M: BitMatrix7): number[] {
  const stages = 7;
  const stageDiffs: number[] = [];

  // Average over all 7 basis unit differences e_0..e_6
  for (let s = 0; s < stages; s++) {
    let activeBitsSum = 0;
    for (let bit = 0; bit < 7; bit++) {
      const deltaIn = 1 << bit;
      // Simulate linear transformation propagation through s stages
      let currentDelta = deltaIn;
      for (let step = 0; step <= s; step++) {
        // Linear layer mix + bit butterfly transposition at stage step
        const mixed = mulVec7(M, currentDelta);
        // Stage butterfly bit mixing
        currentDelta = (mixed ^ ((mixed << 1) & 0x7f) ^ ((mixed >> 1) & 0x7f)) & 0x7f;
        if (currentDelta === 0) currentDelta = mixed || 1;
      }
      activeBitsSum += popcount7(currentDelta);
    }
    const avgActiveBits = activeBitsSum / 7;
    // Normalized to 0 - 100%
    stageDiffs.push(Math.min(100, Math.round((avgActiveBits / 7) * 100)));
  }

  return stageDiffs;
}

/**
 * Local memory clustering metric: measures cache line locality vs divergence.
 * Lower clustering / stride jitter means smoother SIMD load/store pipelining.
 */
export function computeClusteringScore(perm: number[]): number {
  let totalDivergence = 0;
  for (let i = 0; i < perm.length - 1; i++) {
    const stride = Math.abs(perm[i + 1] - perm[i]);
    totalDivergence += Math.min(stride, 64);
  }
  // Normalize into 0..100 index (lower is better locality)
  const normalized = (totalDivergence / (perm.length * 64)) * 100;
  return Math.round(normalized * 10) / 10;
}

/**
 * Differential diffusion heatmap data across 16 canonical input differences and 7 stages
 */
export interface HeatmapRow {
  diffName: string;
  diffHex: string;
  inWeight: number;
  stageWeights: number[]; // length 7
}

export function generateDiffusionHeatmap(M: BitMatrix7): HeatmapRow[] {
  // Select 16 representative input difference vectors (unit vectors + pairs + triads)
  const testDiffs = [
    { name: 'Δe₀ (bit 0)', val: 0x01 },
    { name: 'Δe₁ (bit 1)', val: 0x02 },
    { name: 'Δe₂ (bit 2)', val: 0x04 },
    { name: 'Δe₃ (bit 3)', val: 0x08 },
    { name: 'Δe₄ (bit 4)', val: 0x10 },
    { name: 'Δe₅ (bit 5)', val: 0x20 },
    { name: 'Δe₆ (bit 6)', val: 0x40 },
    { name: 'Δe₀⊕e₁', val: 0x03 },
    { name: 'Δe₂⊕e₃', val: 0x0c },
    { name: 'Δe₄⊕e₅', val: 0x30 },
    { name: 'Δe₀⊕e₆', val: 0x41 },
    { name: 'Δ triad 0', val: 0x07 },
    { name: 'Δ triad 1', val: 0x1c },
    { name: 'Δ triad 2', val: 0x70 },
    { name: 'Δ quad', val: 0x0f },
    { name: 'Δ dense', val: 0x7f },
  ];

  return testDiffs.map(({ name, val }) => {
    let delta = val;
    const stageWeights: number[] = [];
    for (let s = 0; s < 7; s++) {
      const out = mulVec7(M, delta);
      stageWeights.push(popcount7(out));
      // update delta for next butterfly round
      delta = (out ^ ((out << (s % 3 + 1)) & 0x7f)) || out;
    }
    return {
      diffName: name,
      diffHex: `0x${val.toString(16).padStart(2, '0')}`,
      inWeight: popcount7(val),
      stageWeights,
    };
  });
}
