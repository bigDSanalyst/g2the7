import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Server-side Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // AI Autoformalization Endpoint
  app.post('/api/autoformalize', async (req, res) => {
    try {
      const { matrix, displacementK, query, currentLeanCode } = req.body;

      if (!ai) {
        return res.status(200).json({
          status: 'offline_mode',
          response:
            'AI Prover service in local deterministic mode. Pre-verified Mathlib4 formal proofs are active in the workbench.',
          generatedCode: currentLeanCode,
        });
      }

      const prompt = `You are an expert in Lean 4, Mathlib4, and algebraic cryptography.
The user is working with a linear transformation matrix L ∈ GL(7,2) and affine displacement k ∈ F_2^7:
Matrix rows (in decimal): [${matrix ? matrix.join(', ') : '7, 14, 28, 56, 112, 97, 67'}]
Displacement k: 0x${(displacementK ?? 1).toString(16)}

User Request:
${query || 'Autoformalize the AGL(7,2) affine group structure and provide machine-checked proofs for invertibility of L, branch number B(L) = 4, and zero fixed points via k ∉ im(L ⊕ I).'}

Provide:
1. Complete, valid Lean 4 code using Mathlib.Data.Matrix.Basic, Mathlib.Data.ZMod.Basic, and Mathlib.Tactic.
2. Step-by-step mathematical reasoning and tactic explanation (e.g. decide, fin_cases, linear_combination).
3. The definition of the AGL(7,2) affine group structure: semidirect product (F_2^7, +) ⋊ GL(7,2), group multiplication law, and group inverse.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert formal methods researcher autoformalizing finite group cryptography and linear codes in Lean 4 (Mathlib4). Always provide accurate Lean 4 syntax and rigorous mathematical explanations.',
        },
      });

      return res.status(200).json({
        status: 'success',
        response: response.text,
      });
    } catch (error: any) {
      console.error('Autoformalize error:', error);
      return res.status(500).json({
        status: 'error',
        message: error?.message || 'Failed to autoformalize proof',
      });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
