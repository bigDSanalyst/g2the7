/**
 * Precision Mathematical Invariant Ribbon
 * Telemetry HUD conforming to Science & Laboratory Instrumentation guidelines
 */

import React from 'react';
import { MatrixInvariants } from '../types/crypto';

interface InvariantRibbonProps {
  invariants: MatrixInvariants;
}

export const InvariantRibbon: React.FC<InvariantRibbonProps> = ({ invariants }) => {
  const isBranchOptimal = invariants.branchNumber >= 4;
  const isZeroFixed = invariants.hasZeroFixedPoints;
  const isInvertible = invariants.isInvertible;

  return (
    <div className="border-b border-slate-800 bg-[#07090e] px-6 py-3">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Metric 1: Invertibility */}
        <div className="flex flex-col">
          <span className="text-[10px] tracking-wider uppercase font-mono text-slate-400">
            GL(7,2) Invertibility
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-mono font-semibold tabular-nums text-white">
              Rank {invariants.rank}/7
            </span>
            <span className="text-xs font-mono text-slate-400">
              det ≡ {invariants.determinant}
            </span>
          </div>
          <span
            className={`text-[11px] font-mono mt-0.5 ${
              isInvertible ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isInvertible ? '● Full Rank Invertible' : '✖ Singular (Rank Deficient)'}
          </span>
        </div>

        {/* Metric 2: Branch Number */}
        <div className="flex flex-col">
          <span className="text-[10px] tracking-wider uppercase font-mono text-slate-400">
            Branch Invariant B(L)
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-mono font-semibold tabular-nums text-white">
              B(L) = {invariants.branchNumber}
            </span>
            <span className="text-xs font-mono text-slate-400">/ 127 inputs</span>
          </div>
          <span
            className={`text-[11px] font-mono mt-0.5 ${
              isBranchOptimal ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isBranchOptimal ? '● Min Distance ≥ 4' : '▲ Suboptimal Branch (<4)'}
          </span>
        </div>

        {/* Metric 3: Fixed Point Status */}
        <div className="flex flex-col">
          <span className="text-[10px] tracking-wider uppercase font-mono text-slate-400">
            Affine Fixed Points
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-mono font-semibold tabular-nums text-white">
              {invariants.fixedPoints.length}
            </span>
            <span className="text-xs font-mono text-slate-400">
              k = 0x{invariants.displacementK.toString(16).padStart(2, '0')}
            </span>
          </div>
          <span
            className={`text-[11px] font-mono mt-0.5 ${
              isZeroFixed ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isZeroFixed ? '● Zero Fixed Points Locked' : `▲ ${invariants.fixedPoints.length} Fixed Points Detected`}
          </span>
        </div>

        {/* Metric 4: Image Subspace im(L ⊕ I) */}
        <div className="flex flex-col">
          <span className="text-[10px] tracking-wider uppercase font-mono text-slate-400">
            Image im(L ⊕ I)
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-mono font-semibold tabular-nums text-white">
              Dim {invariants.imageDimension}
            </span>
            <span className="text-xs font-mono text-slate-400">hyperplane</span>
          </div>
          <span
            className={`text-[11px] font-mono mt-0.5 ${
              !invariants.kInImageOfLxorI ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {!invariants.kInImageOfLxorI ? '● k ∉ im(L ⊕ I) Guaranteed' : '✖ k ∈ im(L ⊕ I) (Solvable)'}
          </span>
        </div>

        {/* Metric 5: NTT Butterfly Target */}
        <div className="flex flex-col">
          <span className="text-[10px] tracking-wider uppercase font-mono text-slate-400">
            NTT Stage Scope
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-mono font-semibold tabular-nums text-white">
              256 Points
            </span>
            <span className="text-xs font-mono text-slate-400">7 Stages</span>
          </div>
          <span className="text-[11px] font-mono mt-0.5 text-cyan-400">
            ● Zero Pipeline Stalls
          </span>
        </div>
      </div>
    </div>
  );
};
