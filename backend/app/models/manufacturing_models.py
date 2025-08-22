"""
Manufacturing Specific Models
BOM management, production tracking, and manufacturing-specific features
"""

from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Numeric, Text, Date
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, date
from ..db import Base
from ..tenant_models import Tenant


class BillOfMaterials(Base):
    """Bill of Materials (BOM) for manufacturing"""
    __tablename__ = "bill_of_materials"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # BOM Information
    bom_id: Mapped[str] = mapped_column(String(20), nullable=False)  # Manufacturing-specific BOM ID
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[str] = mapped_column(String(20), nullable=False, default="1.0")
    
    # Product Information
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    product_quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    product_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="Pieces")
    
    # BOM Details
    bom_type: Mapped[str] = mapped_column(String(50), nullable=False, default="Production")  # Production, Engineering, Costing
    revision_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    
    # Cost Information
    total_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    labor_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    overhead_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    # Status
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Draft")  # Draft, Approved, Active, Obsolete
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    # Approval
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    product: Mapped["Product"] = relationship("Product")
    approved_by_user: Mapped["User"] = relationship("User")
    bom_components: Mapped[list["BOMComponent"]] = relationship("BOMComponent", back_populates="bom")
    production_orders: Mapped[list["ProductionOrder"]] = relationship("ProductionOrder", back_populates="bom")


class BOMComponent(Base):
    """Individual components in a Bill of Materials"""
    __tablename__ = "bom_components"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Component Details
    bom_id: Mapped[int] = mapped_column(ForeignKey("bill_of_materials.id"), nullable=False)
    component_product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    
    # Quantity Information
    quantity_required: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    quantity_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="Pieces")
    scrap_factor: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)  # Percentage of scrap/waste
    total_quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)  # Including scrap
    
    # Cost Information
    unit_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    # Component Details
    component_type: Mapped[str] = mapped_column(String(50), nullable=False, default="Raw Material")  # Raw Material, Sub-Assembly, Consumable
    position: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Position in assembly
    operation_sequence: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    
    # Status
    is_critical: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_optional: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    bom: Mapped["BillOfMaterials"] = relationship("BillOfMaterials", back_populates="bom_components")
    component_product: Mapped["Product"] = relationship("Product")


class ProductionOrder(Base):
    """Production orders for manufacturing"""
    __tablename__ = "production_orders"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Production Order Details
    production_order_id: Mapped[str] = mapped_column(String(20), nullable=False)  # Manufacturing-specific PO ID
    bom_id: Mapped[int] = mapped_column(ForeignKey("bill_of_materials.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    
    # Production Information
    quantity_to_produce: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    quantity_produced: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quantity_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="Pieces")
    
    # Scheduling
    planned_start_date: Mapped[date] = mapped_column(Date, nullable=False)
    planned_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    actual_start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Priority and Status
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="Normal")  # Low, Normal, High, Urgent
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Planned")  # Planned, In Progress, Completed, Cancelled, On Hold
    
    # Cost Information
    estimated_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    actual_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    labor_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    material_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    overhead_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    # Quality Control
    quality_check_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    quality_check_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    quality_check_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    quality_check_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Assignment
    assigned_to: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    supervisor: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Notes
    production_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    quality_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    bom: Mapped["BillOfMaterials"] = relationship("BillOfMaterials", back_populates="production_orders")
    product: Mapped["Product"] = relationship("Product")
    assigned_to_user: Mapped["User"] = relationship("User", foreign_keys=[assigned_to])
    supervisor_user: Mapped["User"] = relationship("User", foreign_keys=[supervisor])
    quality_check_user: Mapped["User"] = relationship("User", foreign_keys=[quality_check_by])
    production_steps: Mapped[list["ProductionStep"]] = relationship("ProductionStep", back_populates="production_order")
    material_consumption: Mapped[list["MaterialConsumption"]] = relationship("MaterialConsumption", back_populates="production_order")


class ProductionStep(Base):
    """Individual steps in production process"""
    __tablename__ = "production_steps"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Step Details
    production_order_id: Mapped[int] = mapped_column(ForeignKey("production_orders.id"), nullable=False)
    step_name: Mapped[str] = mapped_column(String(200), nullable=False)
    step_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Sequence and Timing
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    actual_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Pending")  # Pending, In Progress, Completed, Skipped
    start_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Assignment
    assigned_to: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Quality Check
    quality_check_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    quality_check_passed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    quality_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Notes
    step_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    production_order: Mapped["ProductionOrder"] = relationship("ProductionOrder", back_populates="production_steps")
    assigned_to_user: Mapped["User"] = relationship("User")


class MaterialConsumption(Base):
    """Track material consumption during production"""
    __tablename__ = "material_consumption"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Consumption Details
    production_order_id: Mapped[int] = mapped_column(ForeignKey("production_orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    
    # Quantity Information
    quantity_planned: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quantity_consumed: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quantity_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="Pieces")
    
    # Cost Information
    unit_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_cost: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    # Consumption Details
    consumption_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    consumed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    production_order: Mapped["ProductionOrder"] = relationship("ProductionOrder", back_populates="material_consumption")
    product: Mapped["Product"] = relationship("Product")
    consumed_by_user: Mapped["User"] = relationship("User")


class WorkCenter(Base):
    """Manufacturing work centers/stations"""
    __tablename__ = "work_centers"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Work Center Information
    work_center_id: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Location and Capacity
    location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    capacity_per_hour: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    capacity_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="Pieces")
    
    # Equipment and Resources
    equipment_list: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of equipment
    required_skills: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of required skills
    
    # Cost Information
    hourly_rate: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    setup_cost: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    # Maintenance
    last_maintenance_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_maintenance_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    maintenance_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")


class QualityControl(Base):
    """Quality control records for production"""
    __tablename__ = "quality_control"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    # Quality Control Details
    production_order_id: Mapped[int] = mapped_column(ForeignKey("production_orders.id"), nullable=False)
    inspection_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    inspector_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    # Inspection Details
    inspection_type: Mapped[str] = mapped_column(String(50), nullable=False)  # In-Process, Final, Sampling
    quantity_inspected: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quantity_passed: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quantity_failed: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    
    # Quality Metrics
    pass_rate: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    defect_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    
    # Defect Information
    defect_types: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of defect types and counts
    defect_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Corrective Actions
    corrective_action_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    corrective_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_taken_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action_taken_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Overall Result
    overall_result: Mapped[str] = mapped_column(String(20), nullable=False, default="Pass")  # Pass, Fail, Conditional Pass
    
    # Notes
    inspection_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant: Mapped[Tenant | None] = relationship("Tenant")
    production_order: Mapped["ProductionOrder"] = relationship("ProductionOrder")
    inspector: Mapped["User"] = relationship("User", foreign_keys=[inspector_id])
    action_taken_user: Mapped["User"] = relationship("User", foreign_keys=[action_taken_by])
