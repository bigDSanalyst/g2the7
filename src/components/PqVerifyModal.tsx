/**
 * "Export to pq-verify" Bridge Modal & Artifact Viewer
 * Generates and downloads the complete verification bundle:
 * 1. agl72_constants.h
 * 2. agl72_harness.c (CBMC formal loop invariants)
 * 3. agl72_proof.lean (Machine-checked Lean 4 theorem file)
 * 4. pq-verify.json (Automated audit runner configuration)
 */

import React, { useState } from 'react';
import { BitMatrix7 } from '../types/crypto';
import { exportPqVerifyZip, generatePqVerifyArtifacts } from '../math/pqVerifyBridge';
import {
  Download,
  Copy,
  Check,
  ShieldCheck,
  X,
  FileCode,
  FileText,
  FileJson,
  Package,
  Terminal,
} from 'lucide-react';

interface PqVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  matrix: BitMatrix7;
  displacementK: number;
}

export const PqVerifyModal: React.FC<PqVerifyModalProps> = ({
  isOpen,
  onClose,
  matrix,
  displacementK,
}) => {
  const [selectedFile, setSelectedFile] = useState<
    'constants' | 'harness' | 'lean' | 'config'
  >('config');
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  if (!isOpen) return null;

  const artifacts = generatePqVerifyArtifacts(matrix, displacementK);

  const getActiveContent = () => {
    switch (selectedFile) {
      case 'constants':
        return { filename: 'agl72_constants.h', content: artifacts.constantsHeader, lang: 'c' };
      case 'harness':
        return { filename: 'agl72_harness.c', content: artifacts.cbmcHarness, lang: 'c' };
      case 'lean':
        return { filename: 'agl72_proof.lean', content: artifacts.lean4Proof, lang: 'lean' };
      case 'config':
        return { filename: 'pq-verify.json', content: artifacts.configJson, lang: 'json' };
    }
  };

  const active = getActiveContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(active.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const blob = await exportPqVerifyZip(matrix, displacementK);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agl72-pq-verify-bridge.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0b0e17] border border-slate-700/80 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-950/40">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Export to pq-verify (The Bridge)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Formally Verified Bundle
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Closes the loop: exports hardware C headers, CBMC loop harnesses, Lean 4 proofs, and pq-verify configuration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer shadow-sm shadow-cyan-900/30 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isZipping ? 'Packaging ZIP...' : 'Download pq-verify.zip'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File Tabs */}
        <div className="px-6 pt-3 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setSelectedFile('config')}
            className={`px-3 py-1.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              selectedFile === 'config'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            pq-verify.json
          </button>
          <button
            onClick={() => setSelectedFile('constants')}
            className={`px-3 py-1.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              selectedFile === 'constants'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            agl72_constants.h
          </button>
          <button
            onClick={() => setSelectedFile('harness')}
            className={`px-3 py-1.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              selectedFile === 'harness'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            agl72_harness.c (CBMC)
          </button>
          <button
            onClick={() => setSelectedFile('lean')}
            className={`px-3 py-1.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              selectedFile === 'lean'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            agl72_proof.lean
          </button>
        </div>

        {/* File Viewer */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between pb-2 mb-2">
            <span className="text-xs font-mono text-cyan-400 font-semibold">
              {active.filename}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded bg-[#131929] border border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy Content'}
            </button>
          </div>

          <div className="flex-1 bg-[#06080e] rounded-lg border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-y-auto leading-relaxed select-text">
            <pre className="whitespace-pre-wrap">{active.content}</pre>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#07090e] rounded-b-xl flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">● 4 Artifacts Bundled</span>
            <span>·</span>
            <span>CBMC Invariant Checkers Ready</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Run with: <code className="text-cyan-300">pq-verify audit --config pq-verify.json</code>
          </div>
        </div>
      </div>
    </div>
  );
};
