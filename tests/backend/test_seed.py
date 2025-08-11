from backend.app.seed import run_seed
from backend.app.db import engine, SessionLocal
from backend.app.models import Base, User, Role, Product, Party, CompanySettings, StockLedgerEntry


def test_seed_creates_minimum_data(tmp_path, monkeypatch):
    # Use a temp sqlite file
    db_path = tmp_path / "ipsc_test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+pysqlite:///{db_path}")

    # Recreate db with new engine
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    run_seed()

    db = SessionLocal()
    try:
        assert db.query(Role).count() >= 4
        assert db.query(User).count() >= 1
        assert db.query(CompanySettings).count() == 1
        assert db.query(Product).count() >= 2
        assert db.query(Party).count() >= 3
        assert db.query(StockLedgerEntry).count() >= 2
    finally:
        db.close()

