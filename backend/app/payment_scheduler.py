"""
Payment Scheduler Service
Handles payment scheduling, reminders, and status tracking
"""
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from enum import Enum

from .models import Payment, PurchasePayment, Invoice, Purchase, Party


class PaymentStatus(str, Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    SCHEDULED = "scheduled"
    OVERDUE = "overdue"
    PARTIAL = "partial"
    PAID = "paid"
    CANCELLED = "cancelled"


class PaymentReminderType(str, Enum):
    """Payment reminder types"""
    DUE_SOON = "due_soon"  # 7 days before due date
    OVERDUE = "overdue"    # Past due date
    CRITICAL = "critical"  # 30 days overdue


class PaymentScheduler:
    """Service for managing payment scheduling and reminders"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_payment_schedule(self, 
                           payment_type: str = "all",
                           status: Optional[PaymentStatus] = None,
                           start_date: Optional[date] = None,
                           end_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Get payment schedule with filtering options
        
        Args:
            payment_type: "invoice", "purchase", or "all"
            status: Payment status filter
            start_date: Start date for filtering
            end_date: End date for filtering
        
        Returns:
            Dictionary with scheduled payments and summary
        """
        scheduled_payments = []
        
        # Invoice payments
        if payment_type in ["invoice", "all"]:
            invoice_payments = self._get_invoice_payment_schedule(status, start_date, end_date)
            scheduled_payments.extend(invoice_payments)
        
        # Purchase payments
        if payment_type in ["purchase", "all"]:
            purchase_payments = self._get_purchase_payment_schedule(status, start_date, end_date)
            scheduled_payments.extend(purchase_payments)
        
        # Calculate summary
        total_scheduled = sum(p["amount"] for p in scheduled_payments)
        total_overdue = sum(p["amount"] for p in scheduled_payments if p["status"] == PaymentStatus.OVERDUE)
        total_pending = sum(p["amount"] for p in scheduled_payments if p["status"] == PaymentStatus.PENDING)
        
        return {
            "scheduled_payments": scheduled_payments,
            "summary": {
                "total_scheduled": total_scheduled,
                "total_overdue": total_overdue,
                "total_pending": total_pending,
                "count": len(scheduled_payments)
            }
        }
    
    def _get_invoice_payment_schedule(self, 
                                    status: Optional[PaymentStatus] = None,
                                    start_date: Optional[date] = None,
                                    end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """Get invoice payment schedule"""
        query = self.db.query(
            Invoice.id,
            Invoice.invoice_no,
            Invoice.due_date,
            Invoice.grand_total,
            Invoice.paid_amount,
            Invoice.balance_amount,
            Invoice.status,
            Party.name.label('party_name'),
            Party.gstin.label('party_gstin')
        ).join(Party, Invoice.customer_id == Party.id)
        
        # Apply filters
        if status:
            if status == PaymentStatus.OVERDUE:
                query = query.filter(Invoice.due_date < date.today())
            elif status == PaymentStatus.PENDING:
                query = query.filter(Invoice.balance_amount > 0)
            elif status == PaymentStatus.PAID:
                query = query.filter(Invoice.balance_amount == 0)
        
        if start_date:
            query = query.filter(Invoice.due_date >= start_date)
        if end_date:
            query = query.filter(Invoice.due_date <= end_date)
        
        invoices = query.all()
        
        scheduled_payments = []
        for invoice in invoices:
            if invoice.balance_amount > 0:  # Only include unpaid amounts
                payment_status = self._determine_payment_status(invoice.due_date, invoice.balance_amount)
                
                scheduled_payments.append({
                    "id": invoice.id,
                    "type": "invoice",
                    "reference": invoice.invoice_no,
                    "party_name": invoice.party_name,
                    "party_gstin": invoice.party_gstin,
                    "due_date": invoice.due_date,
                    "amount": float(invoice.balance_amount),
                    "total_amount": float(invoice.grand_total),
                    "paid_amount": float(invoice.paid_amount),
                    "status": payment_status,
                    "days_overdue": (date.today() - invoice.due_date.date()).days if invoice.due_date.date() < date.today() else 0
                })
        
        return scheduled_payments
    
    def _get_purchase_payment_schedule(self, 
                                     status: Optional[PaymentStatus] = None,
                                     start_date: Optional[date] = None,
                                     end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """Get purchase payment schedule"""
        query = self.db.query(
            Purchase.id,
            Purchase.purchase_no,
            Purchase.due_date,
            Purchase.grand_total,
            Purchase.paid_amount,
            Purchase.balance_amount,
            Purchase.status,
            Party.name.label('party_name'),
            Party.gstin.label('party_gstin')
        ).join(Party, Purchase.vendor_id == Party.id)
        
        # Apply filters
        if status:
            if status == PaymentStatus.OVERDUE:
                query = query.filter(Purchase.due_date < date.today())
            elif status == PaymentStatus.PENDING:
                query = query.filter(Purchase.balance_amount > 0)
            elif status == PaymentStatus.PAID:
                query = query.filter(Purchase.balance_amount == 0)
        
        if start_date:
            query = query.filter(Purchase.due_date >= start_date)
        if end_date:
            query = query.filter(Purchase.due_date <= end_date)
        
        purchases = query.all()
        
        scheduled_payments = []
        for purchase in purchases:
            if purchase.balance_amount > 0:  # Only include unpaid amounts
                payment_status = self._determine_payment_status(purchase.due_date, purchase.balance_amount)
                
                scheduled_payments.append({
                    "id": purchase.id,
                    "type": "purchase",
                    "reference": purchase.purchase_no,
                    "party_name": purchase.party_name,
                    "party_gstin": purchase.party_gstin,
                    "due_date": purchase.due_date,
                    "amount": float(purchase.balance_amount),
                    "total_amount": float(purchase.grand_total),
                    "paid_amount": float(purchase.paid_amount),
                    "status": payment_status,
                    "days_overdue": (date.today() - purchase.due_date.date()).days if purchase.due_date.date() < date.today() else 0
                })
        
        return scheduled_payments
    
    def _determine_payment_status(self, due_date: date, balance_amount: Decimal) -> PaymentStatus:
        """Determine payment status based on due date and balance"""
        if balance_amount == 0:
            return PaymentStatus.PAID
        
        # Convert datetime to date if needed
        if isinstance(due_date, datetime):
            due_date = due_date.date()
        
        if due_date < date.today():
            return PaymentStatus.OVERDUE
        else:
            return PaymentStatus.PENDING
    
    def get_payment_reminders(self, reminder_type: Optional[PaymentReminderType] = None) -> List[Dict[str, Any]]:
        """
        Get payment reminders based on due dates
        
        Args:
            reminder_type: Type of reminder to get
        
        Returns:
            List of payment reminders
        """
        today = date.today()
        reminders = []
        
        # Due soon reminders (7 days before due date)
        if not reminder_type or reminder_type == PaymentReminderType.DUE_SOON:
            due_soon_date = today + timedelta(days=7)
            due_soon_payments = self._get_reminders_by_date_range(today, due_soon_date, PaymentReminderType.DUE_SOON)
            reminders.extend(due_soon_payments)
        
        # Overdue reminders (past due date)
        if not reminder_type or reminder_type == PaymentReminderType.OVERDUE:
            overdue_payments = self._get_reminders_by_date_range(date.min, today, PaymentReminderType.OVERDUE)
            reminders.extend(overdue_payments)
        
        # Critical reminders (30+ days overdue)
        if not reminder_type or reminder_type == PaymentReminderType.CRITICAL:
            critical_date = today - timedelta(days=30)
            critical_payments = self._get_reminders_by_date_range(date.min, critical_date, PaymentReminderType.CRITICAL)
            reminders.extend(critical_payments)
        
        return reminders
    
    def _get_reminders_by_date_range(self, start_date: date, end_date: date, reminder_type: PaymentReminderType) -> List[Dict[str, Any]]:
        """Get reminders for a specific date range"""
        reminders = []
        
        # Invoice reminders
        invoice_query = self.db.query(
            Invoice.id,
            Invoice.invoice_no,
            Invoice.due_date,
            Invoice.balance_amount,
            Party.name.label('party_name'),
            Party.email.label('party_email')
        ).join(Party, Invoice.customer_id == Party.id).filter(
            and_(
                Invoice.balance_amount > 0,
                Invoice.due_date >= start_date,
                Invoice.due_date <= end_date
            )
        )
        
        for invoice in invoice_query.all():
            reminders.append({
                "id": invoice.id,
                "type": "invoice",
                "reference": invoice.invoice_no,
                "party_name": invoice.party_name,
                "party_email": invoice.party_email,
                "due_date": invoice.due_date,
                "amount": float(invoice.balance_amount),
                "reminder_type": reminder_type,
                "days_overdue": (date.today() - invoice.due_date.date()).days if invoice.due_date.date() < date.today() else 0
            })
        
        # Purchase reminders
        purchase_query = self.db.query(
            Purchase.id,
            Purchase.purchase_no,
            Purchase.due_date,
            Purchase.balance_amount,
            Party.name.label('party_name'),
            Party.email.label('party_email')
        ).join(Party, Purchase.vendor_id == Party.id).filter(
            and_(
                Purchase.balance_amount > 0,
                Purchase.due_date >= start_date,
                Purchase.due_date <= end_date
            )
        )
        
        for purchase in purchase_query.all():
            reminders.append({
                "id": purchase.id,
                "type": "purchase",
                "reference": purchase.purchase_no,
                "party_name": purchase.party_name,
                "party_email": purchase.party_email,
                "due_date": purchase.due_date,
                "amount": float(purchase.balance_amount),
                "reminder_type": reminder_type,
                "days_overdue": (date.today() - purchase.due_date.date()).days if purchase.due_date.date() < date.today() else 0
            })
        
        return reminders
    
    def get_payment_analytics(self, start_date: Optional[date] = None, end_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Get payment analytics and insights
        
        Args:
            start_date: Start date for analytics
            end_date: End date for analytics
        
        Returns:
            Dictionary with payment analytics
        """
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        # Payment collection analytics
        invoice_payments = self.db.query(
            func.sum(Payment.payment_amount).label('total_collected'),
            func.count(Payment.id).label('payment_count'),
            func.avg(Payment.payment_amount).label('avg_payment')
        ).filter(
            and_(
                Payment.payment_date >= start_date,
                Payment.payment_date <= end_date
            )
        ).first()
        
        # Payment made analytics
        purchase_payments = self.db.query(
            func.sum(PurchasePayment.payment_amount).label('total_paid'),
            func.count(PurchasePayment.id).label('payment_count'),
            func.avg(PurchasePayment.payment_amount).label('avg_payment')
        ).filter(
            and_(
                PurchasePayment.payment_date >= start_date,
                PurchasePayment.payment_date <= end_date
            )
        ).first()
        
        # Overdue amounts
        overdue_invoices = self.db.query(
            func.sum(Invoice.balance_amount).label('total_overdue')
        ).filter(
            and_(
                Invoice.balance_amount > 0,
                Invoice.due_date < date.today()
            )
        ).first()
        
        overdue_purchases = self.db.query(
            func.sum(Purchase.balance_amount).label('total_overdue')
        ).filter(
            and_(
                Purchase.balance_amount > 0,
                Purchase.due_date < date.today()
            )
        ).first()
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "collections": {
                "total_collected": float(invoice_payments.total_collected or 0),
                "payment_count": invoice_payments.payment_count or 0,
                "avg_payment": float(invoice_payments.avg_payment or 0)
            },
            "payments": {
                "total_paid": float(purchase_payments.total_paid or 0),
                "payment_count": purchase_payments.payment_count or 0,
                "avg_payment": float(purchase_payments.avg_payment or 0)
            },
            "overdue": {
                "total_overdue_receivables": float(overdue_invoices.total_overdue or 0),
                "total_overdue_payables": float(overdue_purchases.total_overdue or 0)
            }
        }
