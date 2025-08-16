"""
GST Report Generation Module

This module handles the generation of GST reports (GSTR-1 and GSTR-3B)
in the exact format required by the GST portal.
"""

import csv
from datetime import datetime, date
from decimal import Decimal
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from .models import Invoice, InvoiceItem, Purchase, PurchaseItem, Party, Product, CompanySettings
from .gst import money


class GSTReportGenerator:
    """Handles GST report generation for GSTR-1 and GSTR-3B"""
    
    def __init__(self, db: Session):
        self.db = db
        self.company = db.query(CompanySettings).first()
    
    def validate_data_for_gstr1(self, start_date: date, end_date: date) -> List[str]:
        """Validate data for GSTR-1 report generation"""
        errors = []
        
        # Check for invoices without HSN codes
        invoices_without_hsn = self.db.query(Invoice).join(InvoiceItem).filter(
            and_(
                Invoice.date >= start_date,
                Invoice.date <= end_date,
                InvoiceItem.hsn_code.is_(None)
            )
        ).distinct().all()
        
        if invoices_without_hsn:
            errors.append(f"Found {len(invoices_without_hsn)} invoices without HSN codes")
        
        # Check for invoices without GSTIN for B2B transactions
        b2b_invoices_without_gstin = self.db.query(Invoice).join(Party, Invoice.customer_id == Party.id).filter(
            and_(
                Invoice.date >= start_date,
                Invoice.date <= end_date,
                Party.gstin.is_(None),
                Party.gst_enabled == True
            )
        ).all()
        
        if b2b_invoices_without_gstin:
            errors.append(f"Found {len(b2b_invoices_without_gstin)} B2B invoices without customer GSTIN")
        
        return errors
    
    def validate_data_for_gstr3b(self, start_date: date, end_date: date) -> List[str]:
        """Validate data for GSTR-3B report generation"""
        errors = []
        
        # Check for purchases without HSN codes
        purchases_without_hsn = self.db.query(Purchase).join(PurchaseItem).filter(
            and_(
                Purchase.date >= start_date,
                Purchase.date <= end_date,
                PurchaseItem.hsn_code.is_(None)
            )
        ).distinct().all()
        
        if purchases_without_hsn:
            errors.append(f"Found {len(purchases_without_hsn)} purchases without HSN codes")
        
        return errors
    
    def generate_gstr1_data(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Generate GSTR-1 data in GST portal format"""
        gstr1_data = []
        
        # Get all invoices in the date range
        invoices = self.db.query(Invoice).filter(
            and_(
                Invoice.date >= start_date,
                Invoice.date <= end_date
            )
        ).all()
        
        for invoice in invoices:
            customer = self.db.query(Party).filter(Party.id == invoice.customer_id).first()
            items = self.db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice.id).all()
            
            for item in items:
                product = self.db.query(Product).filter(Product.id == item.product_id).first()
                
                # Determine supply type
                supply_type = "B2B" if customer and customer.gst_enabled else "B2C"
                
                # GSTR-1 format fields
                row = {
                    "GSTIN/UIN of Recipient": customer.gstin if customer and customer.gst_enabled else "",
                    "Receiver Name": customer.name if customer else "",
                    "Invoice Number": invoice.invoice_no,
                    "Invoice Date": invoice.date.strftime("%d-%m-%Y"),
                    "Invoice Value": float(invoice.grand_total),
                    "Place Of Supply": invoice.place_of_supply_state_code,
                    "Reverse Charge": "Y" if invoice.reverse_charge else "N",
                    "Applicable % of Tax Rate": float(item.gst_rate) if item.gst_rate else 0,
                    "Invoice Type": "Regular" if invoice.invoice_type == "Invoice" else invoice.invoice_type,
                    "E-Commerce GSTIN": "",
                    "Rate": float(item.rate),
                    "Taxable Value": float(item.taxable_value),
                    "Cess Amount": float(item.cess) if item.cess else 0,
                    "Eligibility for ITC": "Ineligible" if supply_type == "B2C" else "Eligible",
                    "Availed ITC Integrated Tax": float(item.igst) if item.igst else 0,
                    "Availed ITC Central Tax": float(item.cgst) if item.cgst else 0,
                    "Availed ITC State/UT Tax": float(item.sgst) if item.sgst else 0,
                    "Availed ITC Cess": float(item.cess) if item.cess else 0,
                    "HSN/SAC": item.hsn_code if item.hsn_code else product.hsn if product else "",
                    "Description": item.description,
                    "Quantity": float(item.qty),
                    "Unit": "PCS",  # Default unit
                    "Total Value": float(item.amount),
                    "Discount": float(item.discount) if item.discount else 0,
                    "CGST Amount": float(item.cgst) if item.cgst else 0,
                    "SGST Amount": float(item.sgst) if item.sgst else 0,
                    "IGST Amount": float(item.igst) if item.igst else 0,
                    "CESS Amount": float(item.cess) if item.cess else 0
                }
                
                gstr1_data.append(row)
        
        return gstr1_data
    
    def generate_gstr3b_data(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Generate GSTR-3B summary data"""
        
        # Get all invoices and purchases in the date range
        invoices = self.db.query(Invoice).filter(
            and_(
                Invoice.date >= start_date,
                Invoice.date <= end_date
            )
        ).all()
        
        purchases = self.db.query(Purchase).filter(
            and_(
                Purchase.date >= start_date,
                Purchase.date <= end_date
            )
        ).all()
        
        # Calculate totals
        total_taxable_value = sum(float(inv.taxable_value) for inv in invoices)
        total_cgst = sum(float(inv.cgst) for inv in invoices)
        total_sgst = sum(float(inv.sgst) for inv in invoices)
        total_igst = sum(float(inv.igst) for inv in invoices)
        total_cess = sum(float(inv.cess) for inv in invoices)
        
        # Calculate input tax credit from purchases
        total_itc_cgst = sum(float(pur.cgst) for pur in purchases)
        total_itc_sgst = sum(float(pur.sgst) for pur in purchases)
        total_itc_igst = sum(float(pur.igst) for pur in purchases)
        total_itc_cess = sum(float(pur.cess) for pur in purchases if hasattr(pur, 'cess'))
        
        gstr3b_data = {
            "summary": {
                "total_taxable_value": total_taxable_value,
                "total_cgst": total_cgst,
                "total_sgst": total_sgst,
                "total_igst": total_igst,
                "total_cess": total_cess,
                "total_itc_cgst": total_itc_cgst,
                "total_itc_sgst": total_itc_sgst,
                "total_itc_igst": total_itc_igst,
                "total_itc_cess": total_itc_cess,
                "net_cgst": total_cgst - total_itc_cgst,
                "net_sgst": total_sgst - total_itc_sgst,
                "net_igst": total_igst - total_itc_igst,
                "net_cess": total_cess - total_itc_cess
            },
            "details": {
                "invoices": len(invoices),
                "purchases": len(purchases),
                "period": f"{start_date.strftime('%d-%m-%Y')} to {end_date.strftime('%d-%m-%Y')}"
            }
        }
        
        return gstr3b_data
    
    def export_gstr1_csv(self, start_date: date, end_date: date) -> str:
        """Export GSTR-1 data to CSV format"""
        data = self.generate_gstr1_data(start_date, end_date)
        
        if not data:
            return ""
        
        # Create CSV content using StringIO
        import io
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        
        return output.getvalue()
    
    def export_gstr3b_csv(self, start_date: date, end_date: date) -> str:
        """Export GSTR-3B data to CSV format"""
        data = self.generate_gstr3b_data(start_date, end_date)
        
        # Create CSV content for GSTR-3B summary
        import io
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["GSTR-3B Summary Report"])
        writer.writerow([f"Period: {data['details']['period']}"])
        writer.writerow([])
        
        # Summary table
        writer.writerow(["Description", "Amount"])
        writer.writerow(["Total Taxable Value", data['summary']['total_taxable_value']])
        writer.writerow(["Total CGST", data['summary']['total_cgst']])
        writer.writerow(["Total SGST", data['summary']['total_sgst']])
        writer.writerow(["Total IGST", data['summary']['total_igst']])
        writer.writerow(["Total CESS", data['summary']['total_cess']])
        writer.writerow([])
        writer.writerow(["Input Tax Credit"])
        writer.writerow(["ITC CGST", data['summary']['total_itc_cgst']])
        writer.writerow(["ITC SGST", data['summary']['total_itc_sgst']])
        writer.writerow(["ITC IGST", data['summary']['total_itc_igst']])
        writer.writerow(["ITC CESS", data['summary']['total_itc_cess']])
        writer.writerow([])
        writer.writerow(["Net Tax Payable"])
        writer.writerow(["Net CGST", data['summary']['net_cgst']])
        writer.writerow(["Net SGST", data['summary']['net_sgst']])
        writer.writerow(["Net IGST", data['summary']['net_igst']])
        writer.writerow(["Net CESS", data['summary']['net_cess']])
        
        return output.getvalue()


def generate_gstr1_report(db: Session, start_date: str, end_date: str) -> Dict[str, Any]:
    """Generate GSTR-1 report"""
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        generator = GSTReportGenerator(db)
        
        # Validate data
        errors = generator.validate_data_for_gstr1(start_dt, end_dt)
        
        if errors:
            return {
                "success": False,
                "errors": errors,
                "message": "Data validation failed"
            }
        
        # Generate data
        data = generator.generate_gstr1_data(start_dt, end_dt)
        csv_content = generator.export_gstr1_csv(start_dt, end_dt)
        
        return {
            "success": True,
            "data": data,
            "csv_content": csv_content,
            "total_records": len(data),
            "period": f"{start_date} to {end_date}"
        }
        
    except Exception as e:
        return {
            "success": False,
            "errors": [str(e)],
            "message": "Failed to generate GSTR-1 report"
        }


def generate_gstr3b_report(db: Session, start_date: str, end_date: str) -> Dict[str, Any]:
    """Generate GSTR-3B report"""
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        generator = GSTReportGenerator(db)
        
        # Validate data
        errors = generator.validate_data_for_gstr3b(start_dt, end_dt)
        
        if errors:
            return {
                "success": False,
                "errors": errors,
                "message": "Data validation failed"
            }
        
        # Generate data
        data = generator.generate_gstr3b_data(start_dt, end_dt)
        csv_content = generator.export_gstr3b_csv(start_dt, end_dt)
        
        return {
            "success": True,
            "data": data,
            "csv_content": csv_content,
            "period": f"{start_date} to {end_date}"
        }
        
    except Exception as e:
        return {
            "success": False,
            "errors": [str(e)],
            "message": "Failed to generate GSTR-3B report"
        }
