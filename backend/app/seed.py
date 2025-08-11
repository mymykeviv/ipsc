from sqlalchemy.orm import Session
from passlib.context import CryptContext
from .db import engine
from .models import Base, Role, User, CompanySettings, Product, Party, StockLedgerEntry

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def run_seed():
    Base.metadata.create_all(bind=engine)
    from .db import SessionLocal

    db: Session = SessionLocal()
    try:
        if not db.query(Role).first():
            roles = [Role(name=r) for r in ["Admin", "Sales", "Accountant", "Store"]]
            db.add_all(roles)
            db.flush()

        if not db.query(User).first():
            admin_role = db.query(Role).filter_by(name="Admin").first()
            db.add(User(username="admin", password_hash=pwd_context.hash("admin123"), role_id=admin_role.id))

        if not db.query(CompanySettings).first():
            db.add(
                CompanySettings(
                    name="Your Company Pvt Ltd",
                    gstin="29ABCDE1234F2Z5",
                    state="Karnataka",
                    state_code="29",
                    invoice_series="FY24-25/INV/",
                )
            )

        if not db.query(Product).first():
            db.add_all(
                [
                    Product(
                        name="Mild Steel Bracket", 
                        description="High quality mild steel bracket for construction",
                        sku="MSB-001", 
                        hsn="7308", 
                        unit="NOS", 
                        gst_rate=18.0, 
                        sales_price=250.00,
                        purchase_price=200.00,
                        stock=100,
                        supplier="Steel Suppliers Ltd",
                        category="Construction"
                    ),
                    Product(
                        name="Hex Bolt M10", 
                        description="Standard hex bolt M10 size",
                        sku="HXB-M10", 
                        hsn="7318", 
                        unit="NOS", 
                        gst_rate=18.0, 
                        sales_price=12.00,
                        purchase_price=8.00,
                        stock=1000,
                        supplier="Fastener World",
                        category="Fasteners"
                    ),
                ]
            )

        if not db.query(Party).first():
            db.add_all(
                [
                    Party(
                        type="customer", 
                        name="Acme Industries", 
                        contact_person="John Smith",
                        contact_number="+91-9876543210",
                        email="john.smith@acme.com",
                        gstin="27AACCA1234A1Z9", 
                        gst_registration_status="GST registered",
                        billing_address_line1="123 Industrial Area",
                        billing_city="Mumbai",
                        billing_state="Maharashtra",
                        billing_country="India",
                        billing_pincode="400001",
                        shipping_address_line1="123 Industrial Area",
                        shipping_city="Mumbai",
                        shipping_state="Maharashtra",
                        shipping_country="India",
                        shipping_pincode="400001",
                        notes="Regular customer with good payment history"
                    ),
                    Party(
                        type="customer", 
                        name="Retail Walk-in", 
                        contact_person=None,
                        contact_number=None,
                        email=None,
                        gstin=None, 
                        gst_registration_status="GST not registered",
                        billing_address_line1="Walk-in Customer",
                        billing_city="Bangalore",
                        billing_state="Karnataka",
                        billing_country="India",
                        billing_pincode="560001",
                        shipping_address_line1=None,
                        shipping_city=None,
                        shipping_state=None,
                        shipping_country=None,
                        shipping_pincode=None,
                        notes="Walk-in retail customers"
                    ),
                    Party(
                        type="vendor", 
                        name="Fabrication Vendor", 
                        contact_person="Rajesh Kumar",
                        contact_number="+91-8765432109",
                        email="rajesh@fabrication.com",
                        gstin="29AABCF1234M1Z7", 
                        gst_registration_status="GST registered",
                        billing_address_line1="456 Factory Lane",
                        billing_city="Bangalore",
                        billing_state="Karnataka",
                        billing_country="India",
                        billing_pincode="560002",
                        shipping_address_line1="456 Factory Lane",
                        shipping_city="Bangalore",
                        shipping_state="Karnataka",
                        shipping_country="India",
                        shipping_pincode="560002",
                        notes="Reliable fabrication vendor"
                    ),
                ]
            )

        db.commit()

        # Opening stock
        msb = db.query(Product).filter_by(sku="MSB-001").first()
        hxb = db.query(Product).filter_by(sku="HXB-M10").first()
        if db.query(StockLedgerEntry).count() == 0:
            db.add_all(
                [
                    StockLedgerEntry(product_id=msb.id, qty=100, entry_type="in", ref_type="seed", ref_id=0),
                    StockLedgerEntry(product_id=hxb.id, qty=1000, entry_type="in", ref_type="seed", ref_id=0),
                ]
            )
            db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()

