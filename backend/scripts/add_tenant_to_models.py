#!/usr/bin/env python3
"""
Script to add tenant_id to all existing models for multi-tenancy support.
This script updates the models.py file to add tenant_id and tenant relationship to all models.
"""

import re
from pathlib import Path

def add_tenant_to_model(model_content, model_name):
    """Add tenant_id field and tenant relationship to a model"""
    
    # Add tenant_id after the id field
    id_pattern = r'(id: Mapped\[int\] = mapped_column\(Integer, primary_key=True, autoincrement=True\))'
    tenant_id_field = '    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)'
    
    # Find the id field and add tenant_id after it
    if re.search(id_pattern, model_content):
        model_content = re.sub(
            id_pattern,
            r'\1\n' + tenant_id_field,
            model_content
        )
    
    # Add tenant relationship at the end of the model (before the closing)
    # Find the last relationship or field
    lines = model_content.split('\n')
    insert_index = len(lines) - 1
    
    # Find where to insert the tenant relationship
    for i, line in enumerate(lines):
        if line.strip() == '' and i > 0:
            # Check if previous line was a relationship
            prev_line = lines[i-1].strip()
            if prev_line.endswith('relationship()') or prev_line.endswith('relationship("")'):
                insert_index = i
                break
    
    # Add tenant relationship
    tenant_relationship = '    tenant: Mapped[Tenant | None] = relationship("Tenant")'
    lines.insert(insert_index, tenant_relationship)
    
    return '\n'.join(lines)

def update_models_file():
    """Update the models.py file to add tenant support to all models"""
    
    models_file = Path("backend/app/models.py")
    
    if not models_file.exists():
        print("❌ models.py file not found")
        return False
    
    # Read the current content
    with open(models_file, 'r') as f:
        content = f.read()
    
    # List of models to update (excluding Role and Tenant models)
    models_to_update = [
        'User', 'CompanySettings', 'Party', 'Product', 'StockLedgerEntry',
        'Invoice', 'InvoiceItem', 'Payment', 'Purchase', 'PurchaseItem',
        'PurchasePayment', 'Expense', 'AuditTrail', 'RecurringInvoiceTemplate',
        'RecurringInvoiceTemplateItem', 'RecurringInvoice', 'PurchaseOrder',
        'PurchaseOrderItem', 'InvoiceTemplate'
    ]
    
    # Update each model
    for model_name in models_to_update:
        # Find the model class
        model_pattern = rf'class {model_name}\(Base\):'
        if re.search(model_pattern, content):
            print(f"✅ Adding tenant support to {model_name}")
            
            # Find the model content
            class_start = content.find(f'class {model_name}(Base):')
            if class_start != -1:
                # Find the end of the class
                class_end = content.find('\n\n', class_start)
                if class_end == -1:
                    class_end = len(content)
                
                # Extract the model content
                model_content = content[class_start:class_end]
                
                # Add tenant support
                updated_model = add_tenant_to_model(model_content, model_name)
                
                # Replace in the main content
                content = content.replace(model_content, updated_model)
        else:
            print(f"⚠️  Model {model_name} not found")
    
    # Write the updated content back
    with open(models_file, 'w') as f:
        f.write(content)
    
    print("✅ Successfully updated models.py with tenant support")
    return True

if __name__ == "__main__":
    update_models_file()
