import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from game_manager import GATE_LOGIC

def test_gate_consistency():
    print("Testing Gate Logic Consistency (XOR vs XNOR)")
    print("-" * 45)
    print(f"{'Inputs':<15} | {'XOR':<10} | {'XNOR':<10} | {'Consistent?'}")
    print("-" * 45)
    
    test_cases = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 1],
        [1, 1, 1, 1],
        [1, 0, 0, 0, 0]
    ]
    
    for inputs in test_cases:
        xor_result = GATE_LOGIC['XOR'](inputs)
        xnor_result = GATE_LOGIC['XNOR'](inputs)
        consistent = (xor_result != xnor_result)
        print(f"{str(inputs):<15} | {str(xor_result):<10} | {str(xnor_result):<10} | {consistent}")

if __name__ == "__main__":
    test_gate_consistency()
