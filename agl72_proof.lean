import Mathlib.Data.Matrix.Basic
import Mathlib.Data.ZMod.Basic
import Mathlib.LinearAlgebra.Matrix.Determinant
import Mathlib.Tactic

namespace AGL72
open Matrix

abbrev F2 := ZMod 2
abbrev Dim7 := Fin 7

def L : Matrix Dim7 Dim7 F2 :=
  !![1, 1, 1, 0, 0, 0, 0;
     0, 1, 1, 1, 0, 0, 0;
     0, 0, 1, 1, 1, 0, 0;
     0, 0, 0, 1, 1, 1, 0;
     0, 0, 0, 0, 1, 1, 1;
     1, 0, 0, 0, 0, 1, 1;
     1, 1, 0, 0, 0, 0, 1]

def k : Dim7 → F2 := ![1, 0, 0, 0, 0, 0, 0]

def hammingWeight (v : Dim7 → F2) : Nat :=
  (List.finRange 7).map (fun i => if v i = 1 then 1 else 0) |>.sum

theorem L_invertible : IsUnit (L.det) := by native_decide

theorem L_branch_number_ge_four :
    ∀ b : Dim7 → F2, b ≠ 0 → hammingWeight b + hammingWeight (L.mulVec b) ≥ 4 := by
  native_decide

theorem zero_fixed_points : ∀ b : Dim7 → F2, L.mulVec b + k ≠ b := by
  native_decide

end AGL72
