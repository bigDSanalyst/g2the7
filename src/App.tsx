/**
 * AGL(7,2) Cryptographic Workbench & Autoformalization Platform
 * Unified environment integrating Lean 4 machine-checked proofs,
 * Reinforcement Learning conjugacy exploration, and E-Graph multi-target SIMD synthesis.
 */

import React, { useState, useMemo } from 'react';
import { BitMatrix7 } from './types/crypto';
import { computeInvariants, PRESET_MATRICES } from './math/algebra';
import { generateLean4Source } from './math/lean4Proofs';
import { ActiveTab, Navbar } from './components/Navbar';
import { InvariantRibbon } from './components/InvariantRibbon';
import { MatrixInspector } from './components/MatrixInspector';
import { Lean4FormalizationView } from './components/Lean4FormalizationView';
import { RLConjugacyView } from './components/RLConjugacyView';
import { SimdCodegenView } from './components/SimdCodegenView';
import { ButterflyLatticeView } from './components/ButterflyLatticeView';
import { PqVerifyModal } from './components/PqVerifyModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('matrix');
  // Canonical circulant matrix with B(L) = 4, det = 1, k = 0x01 not in im(L ⊕ I)
  const [matrix, setMatrix] = useState<BitMatrix7>([7, 14, 28, 56, 112, 97, 67]);
  const [displacementK, setDisplacementK] = useState<number>(0x01);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPqVerifyOpen, setIsPqVerifyOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Compute live mathematical invariants
  const invariants = useMemo(
    () => computeInvariants(matrix, displacementK),
    [matrix, displacementK]
  );

  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_MATRICES.find((p) => p.id === presetId);
    if (preset) {
      setMatrix(preset.matrix);
      setDisplacementK(preset.displacementK);
      showToast(`Loaded preset: ${preset.name}`);
    }
  };

  const handleAdoptMatrix = (newMatrix: BitMatrix7) => {
    setMatrix(newMatrix);
    showToast('Adopted RL-optimized matrix into global workbench');
  };

  const handleExportLean = () => {
    const code = generateLean4Source(matrix, displacementK);
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AGL72_Verification_k${displacementK.toString(16)}.lean`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported AGL72.lean machine-checked source');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 3-Zone Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onExportLean={handleExportLean}
        onOpenPqVerify={() => setIsPqVerifyOpen(true)}
      />

      {/* Real Mathematical Invariants HUD */}
      <InvariantRibbon invariants={invariants} />

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'matrix' && (
          <MatrixInspector
            matrix={matrix}
            displacementK={displacementK}
            invariants={invariants}
            onUpdateMatrix={(m) => {
              setMatrix(m);
              showToast('Matrix updated · Recalculated invariants');
            }}
            onUpdateK={(k) => {
              setDisplacementK(k);
              showToast(`Displacement k set to 0x${k.toString(16).padStart(2, '0')}`);
            }}
            onSelectPreset={handleSelectPreset}
          />
        )}

        {activeTab === 'lean4' && (
          <Lean4FormalizationView
            matrix={matrix}
            displacementK={displacementK}
          />
        )}

        {activeTab === 'rl_search' && (
          <RLConjugacyView
            currentMatrix={matrix}
            displacementK={displacementK}
            onAdoptMatrix={handleAdoptMatrix}
            onOpenPqVerify={() => setIsPqVerifyOpen(true)}
          />
        )}

        {activeTab === 'simd_codegen' && (
          <SimdCodegenView
            matrix={matrix}
            displacementK={displacementK}
            onOpenPqVerify={() => setIsPqVerifyOpen(true)}
          />
        )}

        {activeTab === 'butterfly' && (
          <ButterflyLatticeView
            matrix={matrix}
            displacementK={displacementK}
          />
        )}
      </main>

      {/* Pq-Verify Bridge Modal */}
      <PqVerifyModal
        isOpen={isPqVerifyOpen}
        onClose={() => setIsPqVerifyOpen(false)}
        matrix={matrix}
        displacementK={displacementK}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121929] border border-cyan-500/40 text-cyan-300 px-4 py-2 rounded-lg text-xs font-mono shadow-lg shadow-black/60 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer conforming to anti-slop guidelines */}
      <footer className="border-t border-slate-900 bg-[#06080c] px-6 py-4 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            AGL(7,2) ≅ F₂⁷ ⋊ GL(7,2) Non-Heuristic Structural Layer Platform
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Branch Invariant B(L) = 4</span>
            <span>·</span>
            <span>Zero Fixed Points</span>
            <span>·</span>
            <span>Lean 4.7.0 / Mathlib4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
