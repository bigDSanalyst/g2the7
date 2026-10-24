/**
 * Interactive 7x7 Bit Matrix and Invariant Inspector
 */

import React, { useState } from 'react';
import { BitMatrix7, MatrixInvariants } from '../types/crypto';
import { PRESET_MATRICES, toBinaryString } from '../math/algebra';
import { CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

interface MatrixInspectorProps {
  matrix: BitMatrix7;
  displacementK: number;
  invariants: MatrixInvariants;
  onUpdateMatrix: (m: BitMatrix7) => void;
  onUpdateK: (k: number) => void;
  onSelectPreset: (presetId: string) => void;
}

export const MatrixInspector: React.FC<MatrixInspectorProps> = ({
  matrix,
  displacementK,
  invariants,
  onUpdateMatrix,
  onUpdateK,
  onSelectPreset,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);

  const toggleBit = (row: number, col: number) => {
    const newM = [...matrix] as BitMatrix7;
    newM[row] ^= 1 << col;
    onUpdateMatrix(newM);
  };

  const toggleKBit = (bitIndex: number) => {
    onUpdateK(displacementK ^ (1 << bitIndex));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Preset Selectors */}
      <div className="p-4 rounded-lg bg-[#0e121d] border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Finite Field Linear Layer Presets
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select verified GL(7,2) matrices possessing certified branch number B(L) = 4 and zero fixed points.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Displacement:</span>
            <div className="flex items-center gap-1 bg-[#131929] px-2 py-1 rounded border border-slate-700">
              <span className="text-xs font-mono font-medium text-cyan-400">
                k = 0x{displacementK.toString(16).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESET_MATRICES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className="p-2.5 text-left rounded bg-[#131826] hover:bg-[#1a2236] border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
            >
              <div className="text-xs font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
                {preset.name}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">{preset.tagline}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive 7x7 Matrix + Affine Displacement k */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Matrix Editor (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-lg bg-[#0e121d] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white">
                Linear Layer Matrix L ∈ GL(7,2)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any bit to toggle coefficient in GF(2). Changes update all invariants dynamically.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Dim: 7×7</span>
              <span>·</span>
              <span>F₂ field</span>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="inline-block min-w-full">
              {/* Column labels */}
              <div className="grid grid-cols-9 gap-1.5 mb-1.5 text-center text-[10px] font-mono text-slate-400">
                <span className="text-left pl-1">Row</span>
                {Array.from({ length: 7 }).map((_, c) => (
                  <span key={c}>c{c}</span>
                ))}
                <span>Hex</span>
              </div>

              {/* Rows */}
              {matrix.map((rowVal, r) => {
                const hexVal = `0x${rowVal.toString(16).padStart(2, '0')}`;
                return (
                  <div key={r} className="grid grid-cols-9 gap-1.5 items-center mb-1.5">
                    <span className="text-xs font-mono text-slate-400 pl-1">r{r}</span>
                    {Array.from({ length: 7 }).map((_, c) => {
                      const bit = (rowVal >> c) & 1;
                      const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                      return (
                        <button
                          key={c}
                          onClick={() => toggleBit(r, c)}
                          onMouseEnter={() => setSelectedCell({ r, c })}
                          onMouseLeave={() => setSelectedCell(null)}
                          className={`h-8 sm:h-9 flex items-center justify-center font-mono text-xs rounded transition-all cursor-pointer font-semibold ${
                            bit === 1
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30'
                              : 'bg-[#151b2a] text-slate-400 border border-slate-800/80 hover:bg-slate-800 hover:text-slate-300'
                          } ${isSelected ? 'ring-1 ring-cyan-400' : ''}`}
                        >
                          {bit}
                        </button>
                      );
                    })}
                    <span className="text-xs font-mono text-slate-400 text-center">{hexVal}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Displacement Vector k */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-white">
                Displacement Vector k ∈ F₂⁷ (Affine Translation)
              </span>
              <span className="text-xs font-mono text-slate-400">
                Requirement: k ∉ im(L ⊕ I) (Prevents fixed points)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-slate-400 mr-1">Bits:</span>
              {Array.from({ length: 7 }).map((_, b) => {
                const bit = (displacementK >> b) & 1;
                return (
                  <button
                    key={b}
                    onClick={() => toggleKBit(b)}
                    className={`flex-1 h-8 flex flex-col items-center justify-center font-mono rounded cursor-pointer transition-colors ${
                      bit === 1
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'bg-[#151b2a] text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-semibold">{bit}</span>
                    <span className="text-[9px] text-slate-400">b{b}</span>
                  </button>
                );
              })}
              <div className="ml-2 px-2.5 py-1 rounded bg-[#131929] border border-slate-700 text-xs font-mono text-amber-300 whitespace-nowrap">
                0x{displacementK.toString(16).padStart(2, '0')}
              </div>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono">
              {!invariants.kInImageOfLxorI ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified: k ∉ im(L ⊕ I). Equation (L ⊕ I)b = k has no solutions.
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Warning: k ∈ im(L ⊕ I)! Fixed points exist where Lb ⊕ k = b.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Invariant Weight Distribution & Analysis (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Branch Number Distribution */}
          <div className="p-4 rounded-lg bg-[#0e121d] border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                Branch Weight Spectrum wt(b) + wt(Lb)
              </h4>
              <span className="text-xs font-mono text-cyan-400">
                Min = {invariants.branchNumber}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Distribution of input + output Hamming weights across all 127 non-zero inputs in F₂⁷:
            </p>

            <div className="space-y-2">
              {Object.entries(invariants.weightDistribution)
                .sort(([wA], [wB]) => Number(wA) - Number(wB))
                .map(([weight, count]) => {
                  const percentage = Math.round((count / 127) * 100);
                  const isMin = Number(weight) === invariants.branchNumber;
                  return (
                    <div key={weight} className="text-xs font-mono">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={isMin ? 'text-cyan-400 font-semibold' : 'text-slate-300'}>
                          Weight {weight} {isMin ? '(Branch Bound)' : ''}
                        </span>
                        <span className="text-slate-400">
                          {count} inputs ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#151b2a] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isMin ? 'bg-cyan-400' : 'bg-slate-600'
                          }`}
                          style={{ width: `${Math.max(4, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Min Branch Witnesses Table */}
          <div className="p-4 rounded-lg bg-[#0e121d] border border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-2">
              Minimal Branch Witnesses [wt(b) + wt(Lb) = {invariants.branchNumber}]
            </h4>
            <div className="overflow-x-auto max-h-48">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-1 px-1">Input b</th>
                    <th className="py-1 px-1">L*b</th>
                    <th className="py-1 px-1">wt(b)</th>
                    <th className="py-1 px-1">wt(Lb)</th>
                    <th className="py-1 px-1 text-right">Sum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invariants.minBranchWitnesses.slice(0, 6).map((w, idx) => (
                    <tr key={idx} className="text-slate-300">
                      <td className="py-1 px-1 text-cyan-400">
                        0x{w.input.toString(16).padStart(2, '0')}
                      </td>
                      <td className="py-1 px-1 text-slate-300">
                        0x{w.output.toString(16).padStart(2, '0')}
                      </td>
                      <td className="py-1 px-1">{w.inWeight}</td>
                      <td className="py-1 px-1">{w.outWeight}</td>
                      <td className="py-1 px-1 text-right font-semibold text-emerald-400">
                        {w.sumWeight}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inverse Matrix L⁻¹ */}
          <div className="p-4 rounded-lg bg-[#0e121d] border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                Inverse Matrix L⁻¹ ∈ GL(7,2)
              </h4>
              <span className="text-xs font-mono text-emerald-400">
                {invariants.isInvertible ? 'Calculated via F₂ Gaussian' : 'Undefined'}
              </span>
            </div>
            {invariants.inverseMatrix ? (
              <div className="grid grid-cols-7 gap-1 font-mono text-[10px] text-center">
                {invariants.inverseMatrix.map((row, r) => (
                  <div key={r} className="p-1 rounded bg-[#131929] border border-slate-800">
                    <div className="text-slate-400 text-[9px]">r{r}</div>
                    <div className="text-cyan-300 font-semibold mt-0.5">
                      0x{row.toString(16).padStart(2, '0')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-rose-400 font-mono">
                Singular matrix has no inverse.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
