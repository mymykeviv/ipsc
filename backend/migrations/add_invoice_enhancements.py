"""
Migration script to add enhanced invoice fields
"""
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
import os

def run_migration():
    # Get database URL from environment or use default
    database_url = os.getenv('DATABASE_URL', 'sqlite+pysqlite:///./ipsc.db')
    
    # Create engine
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        # Check if tables exist
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if 'invoices' not in tables:
            print("Invoices table does not exist. Please run the application first to create the database.")
            return
            
        # Check if columns already exist
        existing_columns = [col['name'] for col in inspector.get_columns('invoices')]
        
        # Add new columns to invoices table
        if 'due_date' not in existing_columns:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN due_date DATETIME"))
            print("Added due_date column")
            
        if 'terms' not in existing_columns:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN terms VARCHAR(20) DEFAULT 'Due on Receipt'"))
            print("Added terms column")
            
        if 'bill_to_address' not in existing_columns:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN bill_to_address VARCHAR(200)"))
            print("Added bill_to_address column")
            
        if 'ship_to_address' not in existing_columns:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN ship_to_address VARCHAR(200)"))
            print("Added ship_to_address column")
            
        if 'total_discount' not in existing_columns:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN total_discount DECIMAL(12,2) DEFAULT 0"))
            print("Added total_discount column")
            
        if 'notes' not in existing_columns:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN notes VARCHAR(200)"))
            print("Added notes column")
            
        if 'status' not in existing_columns:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN status VARCHAR(20) DEFAULT 'Draft'"))
            print("Added status column")
            
        if 'created_at' not in existing_columns:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
            print("Added created_at column")
            
        if 'updated_at' not in existing_columns:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
            print("Added updated_at column")
        
        # Check invoice_items table
        if 'invoice_items' not in tables:
            print("Invoice_items table does not exist. Please run the application first to create the database.")
            return
            
        existing_item_columns = [col['name'] for col in inspector.get_columns('invoice_items')]
        
        # Add new columns to invoice_items table
        if 'hsn_code' not in existing_item_columns:
            conn.execute(text("ALTER TABLE invoice_items ADD COLUMN hsn_code VARCHAR(100)"))
            print("Added hsn_code column")
            
        if 'discount' not in existing_item_columns:
            conn.execute(text("ALTER TABLE invoice_items ADD COLUMN discount DECIMAL(12,2) DEFAULT 0"))
            print("Added discount column")
            
        if 'discount_type' not in existing_item_columns:
            conn.execute(text("ALTER TABLE invoice_items ADD COLUMN discount_type VARCHAR(20) DEFAULT 'Percentage'"))
            print("Added discount_type column")
            
        if 'gst_rate' not in existing_item_columns:
            conn.execute(text("ALTER TABLE invoice_items ADD COLUMN gst_rate FLOAT"))
            print("Added gst_rate column")
            
        if 'amount' not in existing_item_columns:
            conn.execute(text("ALTER TABLE invoice_items ADD COLUMN amount DECIMAL(12,2)"))
            print("Added amount column")
        
        # Update existing records with default values
        conn.execute(text("UPDATE invoices SET due_date = date WHERE due_date IS NULL"))
        conn.execute(text("UPDATE invoices SET bill_to_address = 'Default Address' WHERE bill_to_address IS NULL"))
        conn.execute(text("UPDATE invoices SET ship_to_address = 'Default Address' WHERE ship_to_address IS NULL"))
        
        conn.commit()
        print("Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
