"""
Financial Reports Service
Handles generation of P&L, Balance Sheet, and Cash Flow statements
"""
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from enum import Enum

from .models import (
    Invoice, InvoiceItem, Purchase, PurchaseItem, Payment, PurchasePayment, 
    Expense, Party, Product, StockLedgerEntry
)


class ReportType(str, Enum):
    """Financial report types"""
    PROFIT_LOSS = "profit_loss"
    BALANCE_SHEET = "balance_sheet"
    CASH_FLOW = "cash_flow"


class FinancialReports:
    """Service for generating financial reports"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_profit_loss_statement(self, 
                                     start_date: Optional[date] = None,
                                     end_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Generate Profit & Loss Statement
        
        Args:
            start_date: Start date for the period
            end_date: End date for the period
        
        Returns:
            Dictionary with P&L statement data
        """
        if not start_date:
            start_date = date.today().replace(day=1)  # Start of current month
        if not end_date:
            end_date = date.today()
        
        # Revenue (Sales)
        revenue = self._calculate_revenue(start_date, end_date)
        
        # Cost of Goods Sold (COGS)
        cogs = self._calculate_cogs(start_date, end_date)
        
        # Gross Profit
        gross_profit = revenue - cogs
        
        # Operating Expenses
        operating_expenses = self._calculate_operating_expenses(start_date, end_date)
        
        # Operating Profit
        operating_profit = gross_profit - operating_expenses
        
        # Other Income
        other_income = self._calculate_other_income(start_date, end_date)
        
        # Other Expenses
        other_expenses = self._calculate_other_expenses(start_date, end_date)
        
        # Net Profit Before Tax
        net_profit_before_tax = operating_profit + other_income - other_expenses
        
        # Tax (simplified calculation)
        tax = net_profit_before_tax * Decimal('0.25')  # 25% tax rate
        
        # Net Profit After Tax
        net_profit_after_tax = net_profit_before_tax - tax
        
        return {
            "report_type": "profit_loss",
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "revenue": {
                "total_revenue": float(revenue),
                "breakdown": self._get_revenue_breakdown(start_date, end_date)
            },
            "cost_of_goods_sold": {
                "total_cogs": float(cogs),
                "breakdown": self._get_cogs_breakdown(start_date, end_date)
            },
            "gross_profit": {
                "amount": float(gross_profit),
                "margin_percentage": float((gross_profit / revenue * 100) if revenue > 0 else 0)
            },
            "operating_expenses": {
                "total_expenses": float(operating_expenses),
                "breakdown": self._get_operating_expenses_breakdown(start_date, end_date)
            },
            "operating_profit": {
                "amount": float(operating_profit),
                "margin_percentage": float((operating_profit / revenue * 100) if revenue > 0 else 0)
            },
            "other_income": {
                "total_income": float(other_income),
                "breakdown": self._get_other_income_breakdown(start_date, end_date)
            },
            "other_expenses": {
                "total_expenses": float(other_expenses),
                "breakdown": self._get_other_expenses_breakdown(start_date, end_date)
            },
            "net_profit_before_tax": float(net_profit_before_tax),
            "tax": float(tax),
            "net_profit_after_tax": float(net_profit_after_tax)
        }
    
    def generate_balance_sheet(self, as_of_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Generate Balance Sheet
        
        Args:
            as_of_date: Date as of which to generate the balance sheet
        
        Returns:
            Dictionary with balance sheet data
        """
        if not as_of_date:
            as_of_date = date.today()
        
        # Assets
        current_assets = self._calculate_current_assets(as_of_date)
        fixed_assets = self._calculate_fixed_assets(as_of_date)
        total_assets = current_assets + fixed_assets
        
        # Liabilities
        current_liabilities = self._calculate_current_liabilities(as_of_date)
        long_term_liabilities = self._calculate_long_term_liabilities(as_of_date)
        total_liabilities = current_liabilities + long_term_liabilities
        
        # Equity
        equity = total_assets - total_liabilities
        
        return {
            "report_type": "balance_sheet",
            "as_of_date": as_of_date.isoformat(),
            "assets": {
                "current_assets": {
                    "total": float(current_assets),
                    "breakdown": self._get_current_assets_breakdown(as_of_date)
                },
                "fixed_assets": {
                    "total": float(fixed_assets),
                    "breakdown": self._get_fixed_assets_breakdown(as_of_date)
                },
                "total_assets": float(total_assets)
            },
            "liabilities": {
                "current_liabilities": {
                    "total": float(current_liabilities),
                    "breakdown": self._get_current_liabilities_breakdown(as_of_date)
                },
                "long_term_liabilities": {
                    "total": float(long_term_liabilities),
                    "breakdown": self._get_long_term_liabilities_breakdown(as_of_date)
                },
                "total_liabilities": float(total_liabilities)
            },
            "equity": {
                "total_equity": float(equity),
                "breakdown": self._get_equity_breakdown(as_of_date, equity)
            }
        }
    
    def generate_cash_flow_statement(self, 
                                   start_date: Optional[date] = None,
                                   end_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Generate Cash Flow Statement
        
        Args:
            start_date: Start date for the period
            end_date: End date for the period
        
        Returns:
            Dictionary with cash flow statement data
        """
        if not start_date:
            start_date = date.today().replace(day=1)  # Start of current month
        if not end_date:
            end_date = date.today()
        
        # Operating Activities
        operating_cash_flow = self._calculate_operating_cash_flow(start_date, end_date)
        
        # Investing Activities
        investing_cash_flow = self._calculate_investing_cash_flow(start_date, end_date)
        
        # Financing Activities
        financing_cash_flow = self._calculate_financing_cash_flow(start_date, end_date)
        
        # Net Cash Flow
        net_cash_flow = operating_cash_flow + investing_cash_flow + financing_cash_flow
        
        # Opening and Closing Cash Balance
        opening_cash_balance = self._get_cash_balance_at_date(start_date - timedelta(days=1))
        closing_cash_balance = opening_cash_balance + net_cash_flow
        
        return {
            "report_type": "cash_flow",
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "operating_activities": {
                "net_cash_flow": float(operating_cash_flow),
                "breakdown": self._get_operating_cash_flow_breakdown(start_date, end_date)
            },
            "investing_activities": {
                "net_cash_flow": float(investing_cash_flow),
                "breakdown": self._get_investing_cash_flow_breakdown(start_date, end_date)
            },
            "financing_activities": {
                "net_cash_flow": float(financing_cash_flow),
                "breakdown": self._get_financing_cash_flow_breakdown(start_date, end_date)
            },
            "net_cash_flow": float(net_cash_flow),
            "cash_balances": {
                "opening_balance": float(opening_cash_balance),
                "closing_balance": float(closing_cash_balance)
            }
        }
    
    def _calculate_revenue(self, start_date: date, end_date: date) -> Decimal:
        """Calculate total revenue for the period"""
        result = self.db.query(
            func.sum(Invoice.grand_total)
        ).filter(
            and_(
                Invoice.date >= start_date,
                Invoice.date <= end_date,
                Invoice.status.in_(["Paid", "Partially Paid"])
            )
        ).scalar()
        
        return Decimal(str(result or 0))
    
    def _calculate_cogs(self, start_date: date, end_date: date) -> Decimal:
        """Calculate Cost of Goods Sold"""
        # Simplified COGS calculation based on purchases
        result = self.db.query(
            func.sum(Purchase.grand_total)
        ).filter(
            and_(
                Purchase.date >= start_date,
                Purchase.date <= end_date,
                Purchase.status.in_(["Paid", "Partially Paid"])
            )
        ).scalar()
        
        return Decimal(str(result or 0))
    
    def _calculate_operating_expenses(self, start_date: date, end_date: date) -> Decimal:
        """Calculate operating expenses"""
        result = self.db.query(
            func.sum(Expense.amount)
        ).filter(
            and_(
                Expense.expense_date >= start_date,
                Expense.expense_date <= end_date,
                Expense.category.in_(["Office", "Marketing", "Salaries", "Utilities"])
            )
        ).scalar()
        
        return Decimal(str(result or 0))
    
    def _calculate_other_income(self, start_date: date, end_date: date) -> Decimal:
        """Calculate other income"""
        result = self.db.query(
            func.sum(Expense.amount)
        ).filter(
            and_(
                Expense.expense_date >= start_date,
                Expense.expense_date <= end_date,
                Expense.category == "Income"
            )
        ).scalar()
        
        return Decimal(str(result or 0))
    
    def _calculate_other_expenses(self, start_date: date, end_date: date) -> Decimal:
        """Calculate other expenses"""
        result = self.db.query(
            func.sum(Expense.amount)
        ).filter(
            and_(
                Expense.expense_date >= start_date,
                Expense.expense_date <= end_date,
                ~Expense.category.in_(["Office", "Marketing", "Salaries", "Utilities", "Income"])
            )
        ).scalar()
        
        return Decimal(str(result or 0))
    
    def _calculate_current_assets(self, as_of_date: date) -> Decimal:
        """Calculate current assets"""
        # Cash and cash equivalents
        cash_balance = self._get_cash_balance_at_date(as_of_date)
        
        # Accounts receivable
        accounts_receivable = self.db.query(
            func.sum(Invoice.balance_amount)
        ).filter(
            and_(
                Invoice.date <= as_of_date,
                Invoice.balance_amount > 0
            )
        ).scalar() or 0
        
        # Inventory
        inventory_value = self.db.query(
            func.sum(Product.stock * Product.purchase_price)
        ).scalar() or 0
        
        return Decimal(str(cash_balance + accounts_receivable + inventory_value))
    
    def _calculate_fixed_assets(self, as_of_date: date) -> Decimal:
        """Calculate fixed assets"""
        # Simplified fixed assets calculation
        # In a real system, this would include depreciation calculations
        result = self.db.query(
            func.sum(Expense.amount)
        ).filter(
            and_(
                Expense.expense_date <= as_of_date,
                Expense.category == "Fixed Assets"
            )
        ).scalar()
        
        return Decimal(str(result or 0))
    
    def _calculate_current_liabilities(self, as_of_date: date) -> Decimal:
        """Calculate current liabilities"""
        # Accounts payable
        accounts_payable = self.db.query(
            func.sum(Purchase.balance_amount)
        ).filter(
            and_(
                Purchase.date <= as_of_date,
                Purchase.balance_amount > 0
            )
        ).scalar() or 0
        
        return Decimal(str(accounts_payable))
    
    def _calculate_long_term_liabilities(self, as_of_date: date) -> Decimal:
        """Calculate long-term liabilities"""
        # Simplified - in real system would include loans, mortgages, etc.
        return Decimal('0')
    
    def _calculate_operating_cash_flow(self, start_date: date, end_date: date) -> Decimal:
        """Calculate operating cash flow"""
        # Cash received from customers
        cash_received = self.db.query(
            func.sum(Payment.payment_amount)
        ).filter(
            and_(
                Payment.payment_date >= start_date,
                Payment.payment_date <= end_date
            )
        ).scalar() or 0
        
        # Cash paid to suppliers
        cash_paid = self.db.query(
            func.sum(PurchasePayment.payment_amount)
        ).filter(
            and_(
                PurchasePayment.payment_date >= start_date,
                PurchasePayment.payment_date <= end_date
            )
        ).scalar() or 0
        
        # Operating expenses paid
        expenses_paid = self.db.query(
            func.sum(Expense.amount)
        ).filter(
            and_(
                Expense.expense_date >= start_date,
                Expense.expense_date <= end_date
            )
        ).scalar() or 0
        
        return Decimal(str(cash_received - cash_paid - expenses_paid))
    
    def _calculate_investing_cash_flow(self, start_date: date, end_date: date) -> Decimal:
        """Calculate investing cash flow"""
        # Simplified - in real system would include capital expenditures, investments
        return Decimal('0')
    
    def _calculate_financing_cash_flow(self, start_date: date, end_date: date) -> Decimal:
        """Calculate financing cash flow"""
        # Simplified - in real system would include loans, equity investments
        return Decimal('0')
    
    def _get_cash_balance_at_date(self, as_of_date: date) -> Decimal:
        """Get cash balance as of a specific date"""
        # Calculate cash balance based on all transactions up to the date
        cash_received = self.db.query(
            func.sum(Payment.payment_amount)
        ).filter(Payment.payment_date <= as_of_date).scalar() or 0
        
        cash_paid = self.db.query(
            func.sum(PurchasePayment.payment_amount)
        ).filter(PurchasePayment.payment_date <= as_of_date).scalar() or 0
        
        expenses_paid = self.db.query(
            func.sum(Expense.amount)
        ).filter(Expense.expense_date <= as_of_date).scalar() or 0
        
        return Decimal(str(cash_received - cash_paid - expenses_paid))
    
    # Breakdown methods for detailed reporting
    def _get_revenue_breakdown(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get revenue breakdown by customer"""
        results = self.db.query(
            Party.name,
            func.sum(Invoice.grand_total).label('total_revenue')
        ).join(Invoice, Party.id == Invoice.customer_id)\
         .filter(
            and_(
                Invoice.date >= start_date,
                Invoice.date <= end_date,
                Invoice.status.in_(["Paid", "Partially Paid"])
            )
         ).group_by(Party.id, Party.name).all()
        
        return [
            {
                "customer": result.name,
                "revenue": float(result.total_revenue)
            }
            for result in results
        ]
    
    def _get_cogs_breakdown(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get COGS breakdown by vendor"""
        results = self.db.query(
            Party.name,
            func.sum(Purchase.grand_total).label('total_cogs')
        ).join(Purchase, Party.id == Purchase.vendor_id)\
         .filter(
            and_(
                Purchase.date >= start_date,
                Purchase.date <= end_date,
                Purchase.status.in_(["Paid", "Partially Paid"])
            )
         ).group_by(Party.id, Party.name).all()
        
        return [
            {
                "vendor": result.name,
                "cogs": float(result.total_cogs)
            }
            for result in results
        ]
    
    def _get_operating_expenses_breakdown(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get operating expenses breakdown by category"""
        results = self.db.query(
            Expense.category,
            func.sum(Expense.amount).label('total_amount')
        ).filter(
            and_(
                Expense.expense_date >= start_date,
                Expense.expense_date <= end_date,
                Expense.category.in_(["Office", "Marketing", "Salaries", "Utilities"])
            )
        ).group_by(Expense.category).all()
        
        return [
            {
                "category": result.category,
                "amount": float(result.total_amount)
            }
            for result in results
        ]
    
    def _get_other_income_breakdown(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get other income breakdown"""
        results = self.db.query(
            Expense.category,
            func.sum(Expense.amount).label('total_amount')
        ).filter(
            and_(
                Expense.expense_date >= start_date,
                Expense.expense_date <= end_date,
                Expense.category == "Income"
            )
        ).group_by(Expense.category).all()
        
        return [
            {
                "category": result.category,
                "amount": float(result.total_amount)
            }
            for result in results
        ]
    
    def _get_other_expenses_breakdown(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get other expenses breakdown"""
        results = self.db.query(
            Expense.category,
            func.sum(Expense.amount).label('total_amount')
        ).filter(
            and_(
                Expense.expense_date >= start_date,
                Expense.expense_date <= end_date,
                ~Expense.category.in_(["Office", "Marketing", "Salaries", "Utilities", "Income"])
            )
        ).group_by(Expense.category).all()
        
        return [
            {
                "category": result.category,
                "amount": float(result.total_amount)
            }
            for result in results
        ]
    
    def _get_current_assets_breakdown(self, as_of_date: date) -> List[Dict[str, Any]]:
        """Get current assets breakdown"""
        cash_balance = self._get_cash_balance_at_date(as_of_date)
        accounts_receivable = self.db.query(
            func.sum(Invoice.balance_amount)
        ).filter(
            and_(
                Invoice.date <= as_of_date,
                Invoice.balance_amount > 0
            )
        ).scalar() or 0
        
        inventory_value = self.db.query(
            func.sum(Product.stock * Product.purchase_price)
        ).scalar() or 0
        
        return [
            {
                "category": "Cash and Cash Equivalents",
                "amount": float(cash_balance)
            },
            {
                "category": "Accounts Receivable",
                "amount": float(accounts_receivable)
            },
            {
                "category": "Inventory",
                "amount": float(inventory_value)
            }
        ]
    
    def _get_fixed_assets_breakdown(self, as_of_date: date) -> List[Dict[str, Any]]:
        """Get fixed assets breakdown"""
        results = self.db.query(
            Expense.category,
            func.sum(Expense.amount).label('total_amount')
        ).filter(
            and_(
                Expense.expense_date <= as_of_date,
                Expense.category == "Fixed Assets"
            )
        ).group_by(Expense.category).all()
        
        return [
            {
                "category": result.category,
                "amount": float(result.total_amount)
            }
            for result in results
        ]
    
    def _get_current_liabilities_breakdown(self, as_of_date: date) -> List[Dict[str, Any]]:
        """Get current liabilities breakdown"""
        accounts_payable = self.db.query(
            func.sum(Purchase.balance_amount)
        ).filter(
            and_(
                Purchase.date <= as_of_date,
                Purchase.balance_amount > 0
            )
        ).scalar() or 0
        
        return [
            {
                "category": "Accounts Payable",
                "amount": float(accounts_payable)
            }
        ]
    
    def _get_long_term_liabilities_breakdown(self, as_of_date: date) -> List[Dict[str, Any]]:
        """Get long-term liabilities breakdown"""
        return []
    
    def _get_equity_breakdown(self, as_of_date: date, total_equity: Decimal) -> List[Dict[str, Any]]:
        """Get equity breakdown"""
        return [
            {
                "category": "Retained Earnings",
                "amount": float(total_equity)
            }
        ]
    
    def _get_operating_cash_flow_breakdown(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get operating cash flow breakdown"""
        cash_received = self.db.query(
            func.sum(Payment.payment_amount)
        ).filter(
            and_(
                Payment.payment_date >= start_date,
                Payment.payment_date <= end_date
            )
        ).scalar() or 0
        
        cash_paid = self.db.query(
            func.sum(PurchasePayment.payment_amount)
        ).filter(
            and_(
                PurchasePayment.payment_date >= start_date,
                PurchasePayment.payment_date <= end_date
            )
        ).scalar() or 0
        
        expenses_paid = self.db.query(
            func.sum(Expense.amount)
        ).filter(
            and_(
                Expense.expense_date >= start_date,
                Expense.expense_date <= end_date
            )
        ).scalar() or 0
        
        return [
            {
                "category": "Cash Received from Customers",
                "amount": float(cash_received)
            },
            {
                "category": "Cash Paid to Suppliers",
                "amount": -float(cash_paid)
            },
            {
                "category": "Operating Expenses Paid",
                "amount": -float(expenses_paid)
            }
        ]
    
    def _get_investing_cash_flow_breakdown(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get investing cash flow breakdown"""
        return []
    
    def _get_financing_cash_flow_breakdown(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get financing cash flow breakdown"""
        return []
