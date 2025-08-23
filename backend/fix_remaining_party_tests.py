#!/usr/bin/env python3
"""
Script to fix remaining Party creation calls that still use the old 'type' field
"""

import re
import os

def fix_party_creation_in_file(file_path):
    """Fix Party creation calls in a specific file"""
    print(f"Processing: {file_path}")
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern to match Party creation with type field
    patterns = [
        # Pattern 1: Party(..., type="Customer", ...)
        (r'Party\s*\(\s*([^)]*type\s*=\s*["\']Customer["\'][^)]*)\)', "Customer"),
        
        # Pattern 2: Party(..., type="Supplier", ...)
        (r'Party\s*\(\s*([^)]*type\s*=\s*["\']Supplier["\'][^)]*)\)', "Supplier"),
        
        # Pattern 3: Party(..., type="Vendor", ...)
        (r'Party\s*\(\s*([^)]*type\s*=\s*["\']Vendor["\'][^)]*)\)', "Vendor"),
    ]
    
    modified = False
    for pattern, party_type in patterns:
        matches = list(re.finditer(pattern, content))
        for match in reversed(matches):  # Process in reverse to maintain positions
            old_args = match.group(1)
            new_args = fix_party_args(old_args, party_type)
            new_party_call = f"Party({new_args})"
            content = content[:match.start()] + new_party_call + content[match.end():]
            modified = True
            print(f"  Fixed: {match.group(0)} -> {new_party_call}")
    
    if modified:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"  ✅ Updated {file_path}")
    else:
        print(f"  ⏭️  No changes needed in {file_path}")

def fix_party_args(args_str, party_type):
    """Fix Party constructor arguments"""
    # Remove the type argument
    args_str = re.sub(r',?\s*type\s*=\s*["\'][^"\']*["\']', '', args_str)
    
    # Add the appropriate boolean flags based on type (only once at the end)
    if party_type == "Customer":
        args_str = args_str.rstrip(', ') + ', is_customer=True, is_vendor=False'
    elif party_type in ["Supplier", "Vendor"]:
        args_str = args_str.rstrip(', ') + ', is_customer=False, is_vendor=True'
    
    # Clean up any double commas
    args_str = re.sub(r',\s*,', ',', args_str)
    args_str = re.sub(r',\s*$', '', args_str)
    
    return args_str

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
    
    print("🔧 Fixing remaining Party creation calls...")
    
    for file_path in test_files:
        if os.path.exists(file_path):
            fix_party_creation_in_file(file_path)
        else:
            print(f"⚠️  File not found: {file_path}")
    
    print("\n✅ Party creation fixes completed!")

if __name__ == "__main__":
    main()
