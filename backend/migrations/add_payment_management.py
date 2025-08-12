"""
Migration script to add payment management fields
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
        
        # Add payment tracking columns to invoices table
        if 'paid_amount' not in existing_columns:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN paid_amount DECIMAL(12,2) DEFAULT 0"))
            print("Added paid_amount column")
            
        if 'balance_amount' not in existing_columns:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN balance_amount DECIMAL(12,2) DEFAULT 0"))
            print("Added balance_amount column")
        
        # Create payments table if it doesn't exist
        if 'payments' not in tables:
            conn.execute(text("""
                CREATE TABLE payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    invoice_id INTEGER NOT NULL,
                    payment_date DATETIME NOT NULL,
                    payment_amount DECIMAL(12,2) NOT NULL,
                    payment_method VARCHAR(50) NOT NULL,
                    reference_number VARCHAR(100),
                    notes VARCHAR(200),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (invoice_id) REFERENCES invoices (id)
                )
            """))
            print("Created payments table")
        else:
            print("Payments table already exists")
        
        # Update existing invoices to set balance_amount = grand_total
        conn.execute(text("UPDATE invoices SET balance_amount = grand_total WHERE balance_amount IS NULL OR balance_amount = 0"))
        print("Updated existing invoices with balance amounts")
        
        conn.commit()
        print("Payment management migration completed successfully!")

if __name__ == "__main__":
    run_migration()
