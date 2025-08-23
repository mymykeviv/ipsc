#!/usr/bin/env python3
"""
Script to remove account_head from Payment creation calls
"""

import re
import os

def fix_payment_creation_in_file(file_path):
    """Fix Payment creation calls in a specific file"""
    print(f"Processing: {file_path}")
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern to match Payment creation with account_head field
    pattern = r'Payment\s*\(\s*([^)]*account_head\s*=\s*[^,)]+[^)]*)\)'
    
    matches = list(re.finditer(pattern, content))
    modified = False
    
    for match in reversed(matches):  # Process in reverse to maintain positions
        old_args = match.group(1)
        # Remove account_head and its value
        new_args = re.sub(r',?\s*account_head\s*=\s*[^,)]+', '', old_args)
        # Clean up any double commas
        new_args = re.sub(r',\s*,', ',', new_args)
        new_args = re.sub(r',\s*$', '', new_args)
        new_payment_call = f"Payment({new_args})"
        content = content[:match.start()] + new_payment_call + content[match.end():]
        modified = True
        print(f"  Fixed: removed account_head from {match.group(0)}")
    
    if modified:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"  ✅ Updated {file_path}")
    else:
        print(f"  ⏭️  No changes needed in {file_path}")

def main():
    """Main function to fix all test files"""
    test_files = [
        "tests/backend/test_cashflow_integration.py",
        "tests/backend/test_payment_management.py",
        "tests/backend/test_invoice_payments.py",
        "tests/backend/test_purchase_payments.py",
        "tests/backend/test_financial_reports.py",
        "tests/backend/test_cashflow_service.py",
        "tests/backend/test_payment_scheduler.py",
        "tests/test_in_review_features.py",
        "tests/test_filter_endpoints.py",
    ]
    
    print("🔧 Removing account_head from Payment creation calls...")
    
    for file_path in test_files:
        if os.path.exists(file_path):
            fix_payment_creation_in_file(file_path)
        else:
            print(f"⚠️  File not found: {file_path}")
    
    print("\n✅ Payment account_head fixes completed!")

if __name__ == "__main__":
    main()
