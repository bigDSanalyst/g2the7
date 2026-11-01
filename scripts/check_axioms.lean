-- CI prints the axioms each theorem depends on and fails on anything but
-- `propext`: `Lean.ofReduceBool` would mean `native_decide`, `sorryAx` a gap.
import agl72_proof

#print axioms AGL72.L_closed
#print axioms AGL72.Linv_L
#print axioms AGL72.L_Linv
#print axioms AGL72.branch_number_ge
#print axioms AGL72.branch_number_exact
#print axioms AGL72.f_no_fixed_points
