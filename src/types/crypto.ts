/**
 * Cryptographic and Mathematical Types for AGL(7,2) Structural Layer Workbench
 */

export type BitVector7 = number; // 0..127 (7 bits)
export type BitMatrix7 = [number, number, number, number, number, number, number]; // 7 rows of 7-bit values

export interface MatrixInvariants {
  isInvertible: boolean;
  determinant: 0 | 1;
  rank: number;
  branchNumber: number;
  branchNumberVerified: boolean;
  minBranchWitnesses: Array<{
    input: number;
    output: number;
    inWeight: number;
    outWeight: number;
    sumWeight: number;
  }>;
  weightDistribution: Record<number, number>; // sum of weights -> count
  fixedPoints: number[];
  hasZeroFixedPoints: boolean;
  kInImageOfLxorI: boolean;
  imageDimension: number;
  imageBasis: number[];
  displacementK: number;
  inverseMatrix: BitMatrix7 | null;
}

export interface LeanProofGoal {
  id: string;
  title: string;
  status: 'verified' | 'in_progress';
  theoremSignature: string;
  mathStatement: string;
  steps: Array<{
    stepNumber: number;
    tactic: string;
    goalState: string;
    hypotheses: string[];
    explanation: string;
  }>;
  fullLeanCode: string;
}

export interface RLCandidate {
  id: string;
  generation: number;
  matrix: BitMatrix7;
  conjugatorP: BitMatrix7;
  branchNumber: number;
  zeroFixedPoints: boolean;
  diffDiffusion: number; // 0 - 100 higher is better
  localClustering: number; // 0 - 100 lower is better
  rewardScore: number;
  isPareto: boolean;
  stageDiffusions: number[]; // diffusion rate across 7 butterfly stages
}

export type SIMDTarget = 'avx2' | 'avx512' | 'neon' | 'wasm' | 'cuda';

export interface EGraphStage {
  stageNumber: number;
  title: string;
  ruleName: string;
  astNodeCount: number;
  estimatedCycles: number;
  description: string;
  representation: string;
}

export interface VerificationTestVector {
  input: number;
  mathOutput: number;
  simdOutput: number;
  match: boolean;
}
