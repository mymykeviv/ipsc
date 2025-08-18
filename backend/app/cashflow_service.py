"""
Cashflow Service - Consolidates cashflow data from source tables
"""
from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, case, text, String
from .models import Payment, PurchasePayment, Expense, Invoice, Purchase, Party


class CashflowService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_cashflow_summary(self, start_date: Optional[date] = None, end_date: Optional[date] = None) -> Dict[str, Any]:
        """Get cashflow summary for dashboard widgets"""
        
        # Base query filters
        date_filter = []
        if start_date:
            date_filter.append(Payment.payment_date >= start_date)
        if end_date:
            date_filter.append(Payment.payment_date <= end_date)
        
        # Income (Invoice Payments)
        income_query = self.db.query(
            func.sum(Payment.payment_amount).label('total_income'),
            func.count(Payment.id).label('income_count')
        ).filter(and_(*date_filter)) if date_filter else self.db.query(
            func.sum(Payment.payment_amount).label('total_income'),
            func.count(Payment.id).label('income_count')
        )
        
        income_result = income_query.first()
        total_income = float(income_result.total_income or 0)
        income_count = income_result.income_count or 0
        
        # Expenses (Purchase Payments + Expenses)
        purchase_payment_filter = []
        expense_filter = []
        if start_date:
            purchase_payment_filter.append(PurchasePayment.payment_date >= start_date)
            expense_filter.append(Expense.expense_date >= start_date)
        if end_date:
            purchase_payment_filter.append(PurchasePayment.payment_date <= end_date)
            expense_filter.append(Expense.expense_date <= end_date)
        
        # Purchase payments
        purchase_payments_query = self.db.query(
            func.sum(PurchasePayment.payment_amount).label('total_purchase_payments'),
            func.count(PurchasePayment.id).label('purchase_payment_count')
        ).filter(and_(*purchase_payment_filter)) if purchase_payment_filter else self.db.query(
            func.sum(PurchasePayment.payment_amount).label('total_purchase_payments'),
            func.count(PurchasePayment.id).label('purchase_payment_count')
        )
        
        purchase_result = purchase_payments_query.first()
        total_purchase_payments = float(purchase_result.total_purchase_payments or 0)
        purchase_payment_count = purchase_result.purchase_payment_count or 0
        
        # Direct expenses
        expenses_query = self.db.query(
            func.sum(Expense.total_amount).label('total_expenses'),
            func.count(Expense.id).label('expense_count')
        ).filter(and_(*expense_filter)) if expense_filter else self.db.query(
            func.sum(Expense.total_amount).label('total_expenses'),
            func.count(Expense.id).label('expense_count')
        )
        
        expense_result = expenses_query.first()
        total_expenses = float(expense_result.total_expenses or 0)
        expense_count = expense_result.expense_count or 0
        
        total_outflow = total_purchase_payments + total_expenses
        net_cashflow = total_income - total_outflow
        
        # Get invoice amounts for the period (not just payments)
        invoice_filter = []
        if start_date:
            invoice_filter.append(Invoice.date >= start_date)
        if end_date:
            invoice_filter.append(Invoice.date <= end_date)
        
        invoice_query = self.db.query(
            func.sum(Invoice.grand_total).label('total_invoice_amount')
        ).filter(and_(*invoice_filter)) if invoice_filter else self.db.query(
            func.sum(Invoice.grand_total).label('total_invoice_amount')
        )
        
        invoice_result = invoice_query.first()
        total_invoice_amount = float(invoice_result.total_invoice_amount or 0)
        
        # Format dates for response
        start_date_str = start_date.isoformat() if start_date else datetime.now().replace(day=1).isoformat()
        end_date_str = end_date.isoformat() if end_date else datetime.now().isoformat()
        
        return {
            "period": {
                "start_date": start_date_str,
                "end_date": end_date_str
            },
            "total_income": total_income,
            "total_outflow": total_outflow,
            "net_cashflow": net_cashflow,
            "income": {
                "total_invoice_amount": total_invoice_amount,
                "total_payments_received": total_income
            },
            "expenses": {
                "total_expenses": total_expenses,
                "total_purchase_payments": total_purchase_payments,
                "total_outflow": total_outflow
            },
            "cashflow": {
                "net_cashflow": net_cashflow,
                "cash_inflow": total_income,
                "cash_outflow": total_outflow
            }
        }
    
    def get_cashflow_transactions(
        self, 
        search: Optional[str] = None,
        type_filter: Optional[str] = None,
        transaction_type: Optional[str] = None,
        payment_method: Optional[str] = None,
        account_head: Optional[str] = None,
        amount_min: Optional[float] = None,
        amount_max: Optional[float] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        limit: int = 25
    ) -> Dict[str, Any]:
        """Get consolidated cashflow transactions from all source tables"""
        
        # Build queries for each transaction type
        transactions = []
        
        # Invoice Payments (Income)
        if not type_filter or type_filter == 'inflow':
            payment_query = self.db.query(
                Payment.payment_date.label('transaction_date'),
                Payment.payment_amount.label('amount'),
                Payment.payment_method,
                Payment.account_head,
                Payment.reference_number,
                Payment.notes.label('description'),
                func.cast('inflow', String).label('type'),
                func.cast('invoice_payment', String).label('source_type'),
                Payment.id.label('source_id'),
                Payment.created_at,
                Invoice.invoice_no.label('reference_document'),
                Party.name.label('party_name')
            ).join(Invoice, Payment.invoice_id == Invoice.id).join(Party, Invoice.customer_id == Party.id)
            
            # Apply filters
            if search:
                payment_query = payment_query.filter(
                    or_(
                        Party.name.ilike(f"%{search}%"),
                        Invoice.invoice_no.ilike(f"%{search}%"),
                        Payment.reference_number.ilike(f"%{search}%"),
                        Payment.payment_method.ilike(f"%{search}%")
                    )
                )
            
            if start_date:
                payment_query = payment_query.filter(Payment.payment_date >= start_date)
            if end_date:
                payment_query = payment_query.filter(Payment.payment_date <= end_date)
            
            payment_transactions = payment_query.all()
            transactions.extend(payment_transactions)
        
        # Purchase Payments (Outflow)
        if not type_filter or type_filter == 'outflow':
            purchase_payment_query = self.db.query(
                PurchasePayment.payment_date.label('transaction_date'),
                PurchasePayment.payment_amount.label('amount'),
                PurchasePayment.payment_method,
                PurchasePayment.account_head,
                PurchasePayment.reference_number,
                PurchasePayment.notes.label('description'),
                func.cast('outflow', String).label('type'),
                func.cast('purchase_payment', String).label('source_type'),
                PurchasePayment.id.label('source_id'),
                PurchasePayment.created_at,
                Purchase.purchase_no.label('reference_document'),
                Party.name.label('party_name')
            ).join(Purchase, PurchasePayment.purchase_id == Purchase.id).join(Party, Purchase.vendor_id == Party.id)
            
            # Apply filters
            if search:
                purchase_payment_query = purchase_payment_query.filter(
                    or_(
                        Party.name.ilike(f"%{search}%"),
                        Purchase.purchase_no.ilike(f"%{search}%"),
                        PurchasePayment.reference_number.ilike(f"%{search}%"),
                        PurchasePayment.payment_method.ilike(f"%{search}%")
                    )
                )
            
            if start_date:
                purchase_payment_query = purchase_payment_query.filter(PurchasePayment.payment_date >= start_date)
            if end_date:
                purchase_payment_query = purchase_payment_query.filter(PurchasePayment.payment_date <= end_date)
            
            purchase_transactions = purchase_payment_query.all()
            transactions.extend(purchase_transactions)
        
        # Direct Expenses (Outflow)
        if not type_filter or type_filter == 'outflow':
            expense_query = self.db.query(
                Expense.expense_date.label('transaction_date'),
                Expense.total_amount.label('amount'),
                Expense.payment_method,
                Expense.account_head,
                Expense.reference_number,
                Expense.description,
                func.cast('outflow', String).label('type'),
                func.cast('expense', String).label('source_type'),
                Expense.id.label('source_id'),
                Expense.created_at,
                func.cast('', String).label('reference_document'),
                func.cast('', String).label('party_name')
            )
            
            # Apply filters
            if search:
                expense_query = expense_query.filter(
                    or_(
                        Expense.description.ilike(f"%{search}%"),
                        Expense.expense_type.ilike(f"%{search}%"),
                        Expense.reference_number.ilike(f"%{search}%"),
                        Expense.payment_method.ilike(f"%{search}%")
                    )
                )
            
            if start_date:
                expense_query = expense_query.filter(Expense.expense_date >= start_date)
            if end_date:
                expense_query = expense_query.filter(Expense.expense_date <= end_date)
            
            expense_transactions = expense_query.all()
            transactions.extend(expense_transactions)
        
        # Sort by transaction date (newest first)
        transactions.sort(key=lambda x: x.transaction_date, reverse=True)
        
        # Apply pagination
        total_count = len(transactions)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_transactions = transactions[start_idx:end_idx]
        
        return {
            "transactions": [
                {
                    "id": f"{t.source_type}_{t.source_id}",
                    "transaction_date": t.transaction_date.isoformat(),
                    "type": t.type,
                    "description": t.description or f"{t.source_type.replace('_', ' ').title()}",
                    "reference_number": t.reference_number,
                    "payment_method": t.payment_method,
                    "amount": float(t.amount),
                    "account_head": t.account_head,
                    "source_type": t.source_type,
                    "source_id": t.source_id,
                    "reference_document": t.reference_document,
                    "party_name": t.party_name,
                    "created_at": t.created_at.isoformat()
                }
                for t in paginated_transactions
            ],
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
        }
    
    def get_pending_payments(self) -> Dict[str, Any]:
        """Get pending payments for invoices and purchases"""
        
        # Pending invoice payments
        pending_invoices = self.db.query(
            Invoice.id,
            Invoice.invoice_no,
            Invoice.grand_total,
            Invoice.paid_amount,
            Invoice.balance_amount,
            Invoice.due_date,
            Party.name.label('customer_name')
        ).join(Party, Invoice.customer_id == Party.id).filter(
            Invoice.balance_amount > 0,
            Invoice.status.in_(['Sent', 'Partially Paid'])
        ).all()
        
        # Pending purchase payments
        pending_purchases = self.db.query(
            Purchase.id,
            Purchase.purchase_no,
            Purchase.grand_total,
            Purchase.paid_amount,
            Purchase.balance_amount,
            Purchase.due_date,
            Party.name.label('vendor_name')
        ).join(Party, Purchase.vendor_id == Party.id).filter(
            Purchase.balance_amount > 0,
            Purchase.status.in_(['Received', 'Partially Paid'])
        ).all()
        
        total_pending_invoices = sum(float(inv.balance_amount) for inv in pending_invoices)
        total_pending_purchases = sum(float(pur.balance_amount) for pur in pending_purchases)
        
        return {
            "pending_invoices": [
                {
                    "id": inv.id,
                    "document_no": inv.invoice_no,
                    "total_amount": float(inv.grand_total),
                    "paid_amount": float(inv.paid_amount),
                    "pending_amount": float(inv.balance_amount),
                    "due_date": inv.due_date.isoformat(),
                    "party_name": inv.customer_name,
                    "document_type": "invoice"
                }
                for inv in pending_invoices
            ],
            "pending_purchases": [
                {
                    "id": pur.id,
                    "document_no": pur.purchase_no,
                    "total_amount": float(pur.grand_total),
                    "paid_amount": float(pur.paid_amount),
                    "pending_amount": float(pur.balance_amount),
                    "due_date": pur.due_date.isoformat(),
                    "party_name": pur.vendor_name,
                    "document_type": "purchase"
                }
                for pur in pending_purchases
            ],
            "total_pending_invoices": total_pending_invoices,
            "total_pending_purchases": total_pending_purchases,
            "total_pending": total_pending_invoices + total_pending_purchases
        }
    
    def get_financial_year_summary(self, financial_year: str) -> Dict[str, Any]:
        """Get cashflow summary for a specific financial year (e.g., '2024-25')"""
        
        # Parse financial year
        start_year = int(financial_year.split('-')[0])
        start_date = date(start_year, 4, 1)  # April 1st
        end_date = date(start_year + 1, 3, 31)  # March 31st
        
        return self.get_cashflow_summary(start_date, end_date)
    
    def get_expense_history_by_financial_year(self, financial_year: str) -> List[Dict[str, Any]]:
        """Get expense history for a specific financial year"""
        
        # Parse financial year
        start_year = int(financial_year.split('-')[0])
        start_date = date(start_year, 4, 1)  # April 1st
        end_date = date(start_year + 1, 3, 31)  # March 31st
        
        expenses = self.db.query(Expense).filter(
            and_(
                Expense.expense_date >= start_date,
                Expense.expense_date <= end_date
            )
        ).order_by(Expense.expense_date.desc()).all()
        
        return [
            {
                "id": exp.id,
                "expense_date": exp.expense_date.isoformat(),
                "expense_type": exp.expense_type,
                "category": exp.category,
                "description": exp.description,
                "amount": float(exp.total_amount),
                "payment_method": exp.payment_method,
                "account_head": exp.account_head,
                "reference_number": exp.reference_number,
                "vendor_name": exp.vendor_id  # Could join with Party table for vendor name
            }
            for exp in expenses
        ]
