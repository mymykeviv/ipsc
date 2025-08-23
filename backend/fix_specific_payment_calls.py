#!/usr/bin/env python3
"""
Script to fix specific Payment creation calls in test_cashflow_integration.py
"""

def fix_payment_calls():
    """Fix Payment creation calls in the test file"""
    file_path = "tests/backend/test_cashflow_integration.py"
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Replace the specific Payment creation calls
    content = content.replace(
        'payment = Payment(invoice_id=invoice.id,\n            amount=Decimal("600.00"),\n            payment_method="Bank Transfer",\n            account_head="Bank"\n        )',
        'payment = Payment(\n            invoice_id=invoice.id,\n            amount=Decimal("600.00"),\n            payment_method="Bank Transfer"\n        )'
    )
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    print("✅ Fixed Payment creation calls in test_cashflow_integration.py")

if __name__ == "__main__":
    fix_payment_calls()
