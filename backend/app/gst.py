from decimal import Decimal, ROUND_HALF_UP
import re
from typing import Tuple, Optional


def money(v: float | Decimal) -> Decimal:
    return (Decimal(v).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


def validate_gstin(gstin: str) -> bool:
    """
    Validate GSTIN format according to Indian GST rules
    GSTIN format: 2 digits (state code) + 10 digits (PAN) + 1 digit (entity number) + 1 digit (check sum)
    """
    if not gstin:
        return False
    
    # GSTIN should be 15 characters long
    if len(gstin) != 15:
        return False
    
    # First 2 characters should be state code (numeric)
    if not gstin[:2].isdigit():
        return False
    
    # Next 10 characters should be PAN (alphanumeric)
    if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', gstin[2:12]):
        return False
    
    # 13th character should be entity number (alphanumeric)
    if not gstin[12].isalnum():
        return False
    
    # Last character should be check sum (alphanumeric)
    if not gstin[14].isalnum():
        return False
    
    return True


def split_gst(taxable: Decimal, rate: float, intra_state: bool, gst_enabled: bool = True) -> Tuple[Decimal, Decimal, Decimal]:
    """
    Split GST into CGST, SGST, and IGST components
    
    Args:
        taxable: Taxable amount
        rate: GST rate percentage
        intra_state: True if transaction is within same state
        gst_enabled: True if GST should be calculated
    
    Returns:
        Tuple of (CGST, SGST, IGST)
    """
    if not gst_enabled:
        return Decimal('0.00'), Decimal('0.00'), Decimal('0.00')
    
    tax_total = money(taxable * Decimal(rate) / Decimal(100))
    if intra_state:
        cgst = money(tax_total / 2)
        sgst = money(tax_total - cgst)
        igst = Decimal('0.00')
    else:
        cgst = Decimal('0.00')
        sgst = Decimal('0.00')
        igst = tax_total
    return cgst, sgst, igst


def calculate_invoice_totals(items: list, gst_enabled: bool = True, intra_state: bool = True) -> dict:
    """
    Calculate invoice totals with GST components
    
    Args:
        items: List of invoice items with rate, qty, discount, gst_rate
        gst_enabled: True if GST should be calculated
        intra_state: True if transaction is within same state
    
    Returns:
        Dictionary with calculated totals
    """
    subtotal = Decimal('0.00')
    total_discount = Decimal('0.00')
    total_cgst = Decimal('0.00')
    total_sgst = Decimal('0.00')
    total_igst = Decimal('0.00')
    
    for item in items:
        rate = Decimal(str(item['rate']))
        qty = Decimal(str(item['qty']))
        discount = Decimal(str(item.get('discount', 0)))
        gst_rate = Decimal(str(item.get('gst_rate', 0)))
        
        # Calculate item totals
        item_total = rate * qty
        item_discount = discount if item.get('discount_type') == 'Fixed' else (item_total * discount / 100)
        taxable_value = item_total - item_discount
        
        # Calculate GST
        if gst_enabled and gst_rate > 0:
            cgst, sgst, igst = split_gst(taxable_value, float(gst_rate), intra_state, gst_enabled)
            total_cgst += cgst
            total_sgst += sgst
            total_igst += igst
        
        subtotal += item_total
        total_discount += item_discount
    
    grand_total = subtotal - total_discount + total_cgst + total_sgst + total_igst
    
    return {
        'subtotal': money(subtotal),
        'total_discount': money(total_discount),
        'cgst': money(total_cgst),
        'sgst': money(total_sgst),
        'igst': money(total_igst),
        'grand_total': money(grand_total)
    }

