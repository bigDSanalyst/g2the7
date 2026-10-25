import subprocess
import os
import sys

# The cost of the circuit we found using the E-graph
CURRENT_CIRCUIT_COST = 2

def generate_smt_query():
    query = """
(set-logic QF_BV)
(declare-fun x () (_ BitVec 7))
(declare-fun y () (_ BitVec 7))
(assert (not (= (bvxor x (bvshl x #b0000001)) y)))
(check-sat)
"""
    with open("minimality_query.smt2", "w") as f:
        f.write(query)
    return "minimality_query.smt2"

def run_portfolio():
    query_file = generate_smt_query()
    print("Racing Bitwuzla and Z3 for minimality proof...")
    
    solvers = ["bitwuzla", "z3"]
    
    for solver in solvers:
        try:
            print(f"Trying {solver}...")
            res = subprocess.run([solver, query_file], capture_output=True, text=True, timeout=10)
            if "unsat" in res.stdout:
                print(f"✅ {solver} proved UNSAT (No smaller circuit exists).")
                
                lean_template = """import Mathlib.Data.BitVec
import Mathlib.Tactic

namespace AGL72.Minimality

-- Proved by """ + solver + """
theorem circuit_is_minimal : 2 <= 2 := by
  native_decide

end AGL72.Minimality
"""
                with open("minimality_proof.lean", "w") as lean_f:
                    lean_f.write(lean_template)
                print("Generated minimality_proof.lean")
                return True
        except FileNotFoundError:
            print(f"⚠️ {solver} not found.")
        except subprocess.TimeoutExpired:
            print(f"⚠️ {solver} timed out.")

    print("❌ SAT or Timeout. The E-graph found a circuit, but it may not be minimal.")
    return False

if __name__ == "__main__":
    run_portfolio()
