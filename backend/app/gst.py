from decimal import Decimal, ROUND_HALF_UP


def money(v: float | Decimal) -> Decimal:
    return (Decimal(v).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


def split_gst(taxable: Decimal, rate: float, intra_state: bool):
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

