"""
Development seed data for ProfitPath application

This module provides seed data functions specifically for development environments.
It should NEVER be used in production environments.
"""

from sqlalchemy.orm import Session
from .db import legacy_engine
from .models import Base, Role, User, CompanySettings, Product, Party, StockLedgerEntry
from .auth import get_password_hash
import logging

logger = logging.getLogger(__name__)


def run_dev_seed():
    """
    Run development-specific seed data.
    
    This function should ONLY be called in development environments.
    It creates realistic development data for testing features.
    """
    logger.info("🌱 Starting development seed data creation...")
    
    Base.metadata.create_all(bind=legacy_engine)
    from .db import LegacySessionLocal

    db: Session = LegacySessionLocal()
    try:
        # Create roles for development
        if not db.query(Role).first():
            roles = [Role(name=r) for r in ["Admin", "Sales", "Accountant", "Store"]]
            db.add_all(roles)
            db.flush()
            logger.info("✅ Development roles created")

        # Create development admin user
        if not db.query(User).first():
            admin_role = db.query(Role).filter_by(name="Admin").first()
            if admin_role:
                dev_user = User(
                    username="admin", 
                    password_hash=get_password_hash("admin123"), 
                    role_id=admin_role.id
                )
                db.add(dev_user)
                logger.info("✅ Development admin user created")

        # Create development company settings
        if not db.query(CompanySettings).first():
            dev_company = CompanySettings(
                name="ProfitPath Development Company",
                gstin="27DEV1234D1Z5",
                state="Karnataka",
                state_code="29",
                invoice_series="DEV-",
                gst_enabled_by_default=True,
                require_gstin_validation=True
            )
            db.add(dev_company)
            logger.info("✅ Development company settings created")

        # Create development products
        if not db.query(Product).first():
            dev_products = [
                Product(
                    name="Mild Steel Bracket", 
                    description="High quality mild steel bracket for construction",
                    item_type="tradable",
                    sku="MSB-001", 
                    hsn="7308", 
                    unit="NOS", 
                    gst_rate=18.0, 
                    sales_price=250.00,
                    purchase_price=200.00,
                    stock=100,
                    supplier="Steel Suppliers Ltd",
                    category="Construction",
                    is_active=True
                ),
                Product(
                    name="Hex Bolt M10", 
                    description="Standard hex bolt M10 size",
                    item_type="tradable",
                    sku="HXB-M10", 
                    hsn="7318", 
                    unit="NOS", 
                    gst_rate=18.0, 
                    sales_price=12.00,
                    purchase_price=8.00,
                    stock=1000,
                    supplier="Fastener World",
                    category="Fasteners",
                    is_active=True
                ),
                Product(
                    name="Cutting Oil", 
                    description="Industrial cutting oil for machining operations",
                    item_type="consumable",
                    sku="CO-001", 
                    hsn="2710", 
                    unit="Litre", 
                    gst_rate=18.0, 
                    sales_price=0.00,  # No selling price for consumables
                    purchase_price=150.00,
                    stock=50,
                    supplier="Lubricant Suppliers",
                    category="Consumables",
                    is_active=True
                ),
            ]
            db.add_all(dev_products)
            logger.info("✅ Development products created")

        # Create development parties
        if not db.query(Party).first():
            dev_parties = [
                Party(
                    name="Acme Industries", 
                    gstin="27AACCA1234A1Z9",
                    gst_enabled=True,
                    contact_person="John Smith",
                    contact_number="+91-9876543210",
                    email="john.smith@acme.com",
                    billing_address_line1="123 Industrial Area",
                    billing_city="Mumbai",
                    billing_state="Maharashtra",
                    billing_pincode="400001",
                    is_customer=True,
                    is_vendor=False
                ),
                Party(
                    name="Retail Walk-in", 
                    gstin=None,
                    gst_enabled=False,
                    contact_person=None,
                    contact_number=None,
                    email=None,
                    billing_address_line1="Walk-in Customer",
                    billing_city="Bangalore",
                    billing_state="Karnataka",
                    billing_pincode="560001",
                    is_customer=True,
                    is_vendor=False
                ),
                Party(
                    name="Fabrication Vendor", 
                    gstin="29AABCF1234M1Z7",
                    gst_enabled=True,
                    contact_person="Rajesh Kumar",
                    contact_number="+91-8765432109",
                    email="rajesh@fabrication.com",
                    billing_address_line1="456 Factory Lane",
                    billing_city="Bangalore",
                    billing_state="Karnataka",
                    billing_pincode="560002",
                    is_customer=False,
                    is_vendor=True
                ),
            ]
            db.add_all(dev_parties)
            logger.info("✅ Development parties created")

        db.commit()

        # Create opening stock entries
        msb = db.query(Product).filter_by(sku="MSB-001").first()
        hxb = db.query(Product).filter_by(sku="HXB-M10").first()
        
        if db.query(StockLedgerEntry).count() == 0:
            stock_entries = []
            if msb:
                stock_entries.append(StockLedgerEntry(
                    product_id=msb.id, 
                    qty=100, 
                    entry_type="in", 
                    ref_type="dev_seed", 
                    ref_id=0
                ))
            if hxb:
                stock_entries.append(StockLedgerEntry(
                    product_id=hxb.id, 
                    qty=1000, 
                    entry_type="in", 
                    ref_type="dev_seed", 
                    ref_id=0
                ))
            
            if stock_entries:
                db.add_all(stock_entries)
                db.commit()
                logger.info("✅ Development stock entries created")

        logger.info("✅ Development seed data completed successfully")

    except Exception as e:
        logger.error(f"❌ Error creating development seed data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def clear_dev_data():
    """
    Clear all development data from the database.
    
    This function should ONLY be called in development environments.
    """
    logger.info("🧹 Clearing development data...")
    
    from .db import LegacySessionLocal
    db: Session = LegacySessionLocal()
    
    try:
        # Clear in reverse order of dependencies
        db.query(StockLedgerEntry).delete()
        db.query(Party).delete()
        db.query(Product).delete()
        db.query(CompanySettings).delete()
        db.query(User).delete()
        db.query(Role).delete()
        
        db.commit()
        logger.info("✅ Development data cleared successfully")
        
    except Exception as e:
        logger.error(f"❌ Error clearing development data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    # This should only be run in development environments
    import os
    if os.getenv("ENVIRONMENT") not in ["development", "dev"]:
        raise RuntimeError("Development seed data should only be run in development environment")
    
    run_dev_seed()

