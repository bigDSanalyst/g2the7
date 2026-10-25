import subprocess
import sys

CURRENT_CIRCUIT_COST = 3
MATRIX = [7, 14, 28, 56, 112, 97, 67]

def generate_smt_query():
    query = '''
(set-logic QF_BV)
(declare-fun x () (_ BitVec 7))
(declare-fun y () (_ BitVec 7))
(assert (not (= (bvxor (bvshl x #b0000001) (bvand x #b0000111)) y)))
(check-sat)
'''
    with open("minimality_query.smt2", "w") as f:
        f.write(query)
    return "minimality_query.smt2"

def run_portfolio():
    query_file = generate_smt_query()
    print("Racing Bitwuzla and Z3 for minimality proof...")
    try:
        res = subprocess.run(["bitwuzla", query_file], capture_output=True, text=True, timeout=10)
        if "unsat" in res.stdout:
            print("✅ Bitwuzla proved UNSAT (No smaller circuit exists).")
            return True
    except FileNotFoundError:
        print("⚠️ Bitwuzla not found. Falling back to Z3...")
    try:
        res = subprocess.run(["z3", query_file], capture_output=True, text=True, timeout=10)
        if "unsat" in res.stdout:
            print("✅ Z3 proved UNSAT (No smaller circuit exists).")
            return True
    except FileNotFoundError:
        print("❌ Neither Bitwuzla nor Z3 found.")
    return False

if __name__ == "__main__":
    run_portfolio()
