#!/usr/bin/env python3

import sqlite3
import os

def create_invoice_templates_table():
    db_path = 'cashflow.db'
    
    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create invoice_templates table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS invoice_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description VARCHAR(200),
                template_type VARCHAR(20) NOT NULL DEFAULT 'professional',
                primary_color VARCHAR(7) NOT NULL DEFAULT '#2c3e50',
                secondary_color VARCHAR(7) NOT NULL DEFAULT '#3498db',
                accent_color VARCHAR(7) NOT NULL DEFAULT '#e74c3c',
                header_font VARCHAR(50) NOT NULL DEFAULT 'Helvetica-Bold',
                body_font VARCHAR(50) NOT NULL DEFAULT 'Helvetica',
                header_font_size INTEGER NOT NULL DEFAULT 18,
                body_font_size INTEGER NOT NULL DEFAULT 10,
                show_logo BOOLEAN NOT NULL DEFAULT 1,
                logo_position VARCHAR(20) NOT NULL DEFAULT 'top-left',
                show_company_details BOOLEAN NOT NULL DEFAULT 1,
                show_customer_details BOOLEAN NOT NULL DEFAULT 1,
                show_supplier_details BOOLEAN NOT NULL DEFAULT 1,
                show_terms BOOLEAN NOT NULL DEFAULT 1,
                show_notes BOOLEAN NOT NULL DEFAULT 1,
                show_footer BOOLEAN NOT NULL DEFAULT 1,
                header_text VARCHAR(100) NOT NULL DEFAULT 'TAX INVOICE',
                footer_text VARCHAR(200) NOT NULL DEFAULT 'Thank you for your business!',
                terms_text VARCHAR(200) NOT NULL DEFAULT 'Payment is due within the terms specified above.',
                is_active BOOLEAN NOT NULL DEFAULT 1,
                is_default BOOLEAN NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert default template
        cursor.execute('''
            INSERT OR IGNORE INTO invoice_templates (
                name, description, template_type, primary_color, secondary_color, accent_color,
                header_font, body_font, header_font_size, body_font_size,
                show_logo, logo_position, show_company_details, show_customer_details,
                show_supplier_details, show_terms, show_notes, show_footer,
                header_text, footer_text, terms_text, is_active, is_default
            ) VALUES (
                'Default Professional',
                'Default professional invoice template with clean design',
                'professional',
                '#2c3e50',
                '#3498db',
                '#e74c3c',
                'Helvetica-Bold',
                'Helvetica',
                18,
                10,
                1,
                'top-left',
                1,
                1,
                1,
                1,
                1,
                1,
                'TAX INVOICE',
                'Thank you for your business!',
                'Payment is due within the terms specified above.',
                1,
                1
            )
        ''')
        
        conn.commit()
        print("Invoice templates table created successfully!")
        print("Default template inserted.")
        
    except Exception as e:
        print(f"Error creating table: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_invoice_templates_table()
