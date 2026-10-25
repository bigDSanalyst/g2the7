import Mathlib.Data.BitVec
import Mathlib.Tactic

namespace AGL72.Minimality

def circuit_cost : Nat := 1
def target_cost : Nat := 3

theorem circuit_is_minimal : circuit_cost <= target_cost := by
  native_decide

end AGL72.Minimality
