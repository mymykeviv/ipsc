#!/usr/bin/env python3
"""
Script to fix Party creation calls in test files
"""
import re

def fix_party_creation_calls():
    """Fix all Party creation calls to use correct fields"""
    files_to_fix = [
        "tests/backend/test_advanced_invoice_features.py",
        "tests/backend/test_cashflow_integration.py"
    ]
    
    for file_path in files_to_fix:
        print(f"Fixing {file_path}...")
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Fix Customer creation
        content = re.sub(
            r'Party\(\s*name="([^"]+)",\s*type="Customer",\s*gst_enabled=True,([^)]+)billing_country="India"',
            r'Party(\n            name="\1",\n            gst_enabled=True,\n            is_customer=True,\n            is_vendor=False,\2',
            content
        )
        
        # Fix Supplier creation
        content = re.sub(
            r'Party\(\s*name="([^"]+)",\s*type="Supplier",\s*gst_enabled=True,([^)]+)billing_country="India"',
            r'Party(\n            name="\1",\n            gst_enabled=True,\n            is_customer=False,\n            is_vendor=True,\2',
            content
        )
        
        # Fix Vendor creation (same as Supplier)
        content = re.sub(
            r'Party\(\s*name="([^"]+)",\s*type="Vendor",\s*gst_enabled=True,([^)]+)billing_country="India"',
            r'Party(\n            name="\1",\n            gst_enabled=True,\n            is_customer=False,\n            is_vendor=True,\2',
            content
        )
        
        # Remove billing_country from remaining instances
        content = re.sub(r',\s*billing_country="India"', '', content)
        
        with open(file_path, 'w') as f:
            f.write(content)
        
        print(f"✅ Fixed {file_path}")
    
    print("✅ Fixed Party creation calls in all test files")

if __name__ == "__main__":
    fix_party_creation_calls()
