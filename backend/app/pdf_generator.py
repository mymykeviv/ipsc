"""
PDF Generator for GST Invoice Templates
Generates HTML-based PDFs using the new design system
"""

import json
from typing import Dict, Any, List
from .pdf_design_tokens import get_table_columns, get_design_tokens
from .pdf_css import get_css_for_template


class PDFGenerator:
    """PDF Generator for GST Invoice Templates"""
    
    def __init__(self):
        self.design_tokens = get_design_tokens()
    
    def generate_invoice_pdf(self, invoice_data: Dict[str, Any], template_id: str, paper_size: str = "A4") -> str:
        """Generate HTML for invoice PDF based on template"""
        
        # Get template-specific configurations
        columns_key = self._resolve_columns_key(template_id, paper_size)
        table_columns = get_table_columns(columns_key)
        css = get_css_for_template(template_id, paper_size)
        
        # Generate HTML based on template
        if template_id.startswith("GST_TABULAR"):
            html = self._generate_gst_tabular_html(invoice_data, table_columns, paper_size)
        elif template_id.startswith("GST_SIMPLE"):
            html = self._generate_gst_simple_html(invoice_data, table_columns, paper_size)
        elif template_id.startswith("GST_DETAILED"):
            html = self._generate_gst_detailed_html(invoice_data, table_columns, paper_size)
        elif template_id.startswith("GST_LOGISTICS"):
            html = self._generate_gst_logistics_html(invoice_data, table_columns, paper_size)
        elif template_id.startswith("NONGST_SIMPLE"):
            html = self._generate_nongst_simple_html(invoice_data, table_columns, paper_size)
        elif template_id.startswith("NONGST_TABULAR"):
            html = self._generate_nongst_tabular_html(invoice_data, table_columns, paper_size)
        else:
            # Default to GST Tabular
            html = self._generate_gst_tabular_html(invoice_data, table_columns, paper_size)
        
        # Append a small footer marker to help verify template switching
        html += f"\n<div class=\"pdf-footer\">Template: {template_id} · Paper: {paper_size}</div>\n"
        
        # Wrap with complete HTML document
        full_html = self._wrap_html_document(html, css, invoice_data.get("invoice", {}).get("title", "Invoice"))
        
        return full_html

    def _resolve_columns_key(self, template_id: str, paper_size: str) -> str:
        """Resolve the table column configuration key for a given template and paper size"""
        if template_id.startswith("GST_TABULAR"):
            return "GST_TABULAR_STANDARD_A5" if paper_size == "A5" else "GST_TABULAR_STANDARD_A4"
        if template_id.startswith("GST_SIMPLE"):
            # Simplified GST layout uses compact A5-style columns even on A4
            return "GST_SIMPLE_A5"
        if template_id.startswith("GST_DETAILED"):
            # Detailed GST is A4 oriented; use standard A4 columns
            return "GST_TABULAR_STANDARD_A4"
        if template_id.startswith("GST_LOGISTICS"):
            return "GST_LOGISTICS_A4"
        if template_id.startswith("NONGST_TABULAR"):
            return "NONGST_TABULAR_A4A5"
        if template_id.startswith("NONGST_SIMPLE"):
            # Use non-GST tabular compact columns for simple view as well
            return "NONGST_TABULAR_A4A5"
        # Fallback
        return "GST_TABULAR_STANDARD_A4"
    
    def _wrap_html_document(self, content: str, css: str, title: str) -> str:
        """Wrap content in complete HTML document"""
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        {css}
    </style>
</head>
<body>
    {content}
</body>
</html>
"""
    
    def _generate_gst_tabular_html(self, data: Dict[str, Any], columns: List[Dict], paper_size: str) -> str:
        """Generate GST Tabular template HTML"""
        
        supplier = data.get("supplier", {})
        invoice = data.get("invoice", {})
        customer = data.get("customer", {})
        ship_to = data.get("ship_to", {})
        items = data.get("items", [])
        charges = data.get("charges", [])
        
        # Determine if intra-state or inter-state
        is_intra_state = supplier.get("address", {}).get("state_code") == invoice.get("place_of_supply", {}).get("state_code")
        
        # Prepare supplier fields for display
        sup_addr = supplier.get("address", {})
        addr_line1 = sup_addr.get("line1", "")
        addr_line2 = sup_addr.get("line2", "")
        addr_city = sup_addr.get("city", "")
        addr_state = sup_addr.get("state", "")
        addr_pin = sup_addr.get("pin", "")
        sup_gstin = supplier.get("gstin", "")
        sup_phone = supplier.get("phone", supplier.get("contact", {}).get("phone", ""))
        sup_email = supplier.get("email", supplier.get("contact", {}).get("email", ""))

        # Compose city/state/pin single line
        csp_parts = []
        if addr_city:
            csp_parts.append(addr_city)
        if addr_state:
            csp_parts.append(addr_state)
        if addr_pin:
            csp_parts.append(addr_pin)
        csp_line = ", ".join(csp_parts)

        html = f"""
<div class="pdf-page {paper_size}">
    <div class="pdf-header">
        <div class="pdf-brand">
            {f'<img class="pdf-logo" src="{supplier.get("logo_url", "")}" />' if supplier.get("logo_url") else ''}
            <div class="pdf-supplier">
                <h1>{supplier.get("legal_name", "")}</h1>
                {f'<div class="trade">{supplier.get("trade_name", "")}</div>' if supplier.get("trade_name") else ''}
                <div class="addr">
                    {f'<div>{addr_line1}</div>' if addr_line1 else ''}
                    {f'<div>{addr_line2}</div>' if addr_line2 else ''}
                    {f'<div>{csp_line}</div>' if csp_line else ''}
                </div>
                <div class="contact">
                    {f'<div class="line u-muted">GSTIN: {sup_gstin}</div>' if sup_gstin else ''}
                    {f'<div class="line u-muted">Phone: {sup_phone}</div>' if sup_phone else ''}
                    {f'<div class="line u-muted">Email: {sup_email}</div>' if sup_email else ''}
                </div>
            </div>
        </div>
        <div class="pdf-invmeta">
            <div class="title">{invoice.get("title", "Tax Invoice")}</div>
            <div class="row"><span class="key">Invoice #:</span><span class="val">{invoice.get("number", "")}</span></div>
            <div class="row"><span class="key">Date:</span><span class="val">{invoice.get("date", "")}</span></div>
            <div class="row"><span class="key">Due:</span><span class="val">{invoice.get("due_date", "")}</span></div>
            <div class="row"><span class="key">Place of Supply:</span><span class="val">{self._format_place_of_supply(invoice.get("place_of_supply", {}))}</span></div>
            <div class="row"><span class="key">Reverse Charge:</span><span class="val">{invoice.get("reverse_charge", False)}</span></div>
        </div>
    </div>
"""
        
        # Add E-invoice block if applicable
        if invoice.get("e_invoicing", {}).get("applicable"):
            e_invoice = invoice.get("e_invoicing", {})
            html += f"""
    <div class="pdf-einv">
        <div><div class="u-muted">IRN</div><div class="u-mono">{e_invoice.get("irn", "")}</div></div>
        <div><div class="u-muted">Ack No</div><div>{e_invoice.get("ack_no", "")}</div></div>
        <div><div class="u-muted">Ack Date</div><div>{e_invoice.get("ack_date", "")}</div></div>
        <div class="qr"><img src="{e_invoice.get("qr_code_data", "")}" /></div>
    </div>
"""
        
        # Add parties section
        html += f"""
    <div class="pdf-parties">
        <div class="party-card">
            <div class="title">Bill To</div>
            <div class="line">{customer.get("name", "")}</div>
            <div class="line u-muted">GSTIN: {customer.get("gstin", "")}</div>
            <div class="line">{self._format_address(customer.get("address", {}))}</div>
        </div>
"""
        
        if not ship_to.get("use_bill_to", True):
            html += f"""
        <div class="party-card">
            <div class="title">Ship To</div>
            <div class="line">{ship_to.get("name", "")}</div>
            <div class="line">{self._format_address(ship_to.get("address", {}))}</div>
        </div>
"""
        else:
            html += f"""
        <div class="party-card">
            <div class="title">Ship To</div>
            <div class="line">Same as Bill To</div>
        </div>
"""
        
        html += """
    </div>
"""
        
        # Add items table
        html += f"""
    <table class="pdf-table items striped">
        <thead>
            <tr>
"""
        
        for col in columns:
            html += f'                <th class="{col["class"]}">{col["label"]}</th>\n'
        
        html += """
            </tr>
        </thead>
        <tbody>
"""
        
        for i, item in enumerate(items, 1):
            # Calculate values
            qty = item.get("quantity", 0)
            rate = item.get("unit_price", 0)
            discount = self._calculate_discount(item.get("discount", {}), qty * rate)
            taxable_value = max(0, (qty * rate) - discount)
            tax_rate = item.get("tax", {}).get("rate", 0)
            
            if is_intra_state:
                cgst_rate = tax_rate / 2
                sgst_rate = tax_rate / 2
                igst_rate = 0
                cgst_amt = taxable_value * cgst_rate / 100
                sgst_amt = taxable_value * sgst_rate / 100
                igst_amt = 0
            else:
                cgst_rate = 0
                sgst_rate = 0
                igst_rate = tax_rate
                cgst_amt = 0
                sgst_amt = 0
                igst_amt = taxable_value * igst_rate / 100
            
            line_total = taxable_value + cgst_amt + sgst_amt + igst_amt
            
            html += f"""
            <tr>
                <td>{i}</td>
                <td>{item.get("description", "")}</td>
                <td>{item.get("hsn_sac", "")}</td>
                <td class="num">{qty}</td>
                <td>{item.get("uqc", "")}</td>
                <td class="num">{rate:.2f}</td>
                <td class="num">{discount:.2f}</td>
                <td class="num">{taxable_value:.2f}</td>
                <td class="num">{cgst_rate:.1f}</td>
                <td class="num">{cgst_amt:.2f}</td>
                <td class="num">{sgst_rate:.1f}</td>
                <td class="num">{sgst_amt:.2f}</td>
                <td class="num">{igst_rate:.1f}</td>
                <td class="num">{igst_amt:.2f}</td>
                <td class="num">{line_total:.2f}</td>
            </tr>
"""
        
        html += """
        </tbody>
    </table>
"""
        
        # Add totals
        totals = self._calculate_totals(items, charges, is_intra_state)
        html += f"""
    <div class="pdf-totals">
        <div class="row"><div class="label">Taxable Subtotal</div><div class="value">₹{totals["taxable_subtotal"]:.2f}</div></div>
        <div class="row"><div class="label">CGST Total</div><div class="value">₹{totals["cgst_total"]:.2f}</div></div>
        <div class="row"><div class="label">SGST Total</div><div class="value">₹{totals["sgst_total"]:.2f}</div></div>
        <div class="row"><div class="label">IGST Total</div><div class="value">₹{totals["igst_total"]:.2f}</div></div>
        <div class="row"><div class="label">Cess Total</div><div class="value">₹{totals["cess_total"]:.2f}</div></div>
        <div class="row grand"><div class="label">Grand Total</div><div class="value">₹{totals["grand_total"]:.2f}</div></div>
    </div>
"""
        
        # Add amount in words
        html += f"""
    <div class="pdf-amount-words">Amount in words: {self._number_to_words(totals["grand_total"])}</div>
"""
        
        # Add bank details
        if supplier.get("bank"):
            bank = supplier.get("bank", {})
            html += f"""
    <div class="pdf-bank">
        <div class="pdf-section-title">Bank Details</div>
        <div>{bank.get("bank_name", "")}, A/c {bank.get("account_number", "")}, IFSC {bank.get("ifsc", "")}, UPI {bank.get("upi_id", "")}</div>
    </div>
"""
        
        # Add declaration
        html += f"""
    <div class="pdf-declare">
        <div class="pdf-section-title">Declaration</div>
        <div>{data.get("declaration", "We declare that this invoice shows the actual price and particulars are true.")}</div>
    </div>
"""
        
        # Add signature
        signatory = data.get("signatory", {})
        html += f"""
    <div class="pdf-sign">
        <div class="sig-box">
            {f'<img class="sig-img" src="{signatory.get("image", "")}" />' if signatory.get("image") else ''}
            <div class="sig-label">Authorized Signatory</div>
        </div>
        <div class="seal"></div>
    </div>
</div>
"""
        
        return html

    def _generate_gst_logistics_html(self, data: Dict[str, Any], columns: List[Dict], paper_size: str) -> str:
        """Generate GST Logistics Transporter template HTML (GST Tabular + transport details)"""
        base_html = self._generate_gst_tabular_html(data, columns, paper_size)
        inv = data.get("invoice", {})
        transport = inv.get("transport", {}) or {}
        mode = transport.get("mode", "")
        vehicle = transport.get("vehicle_no", "")
        lr_no = transport.get("lr_no", "")
        eway = inv.get("eway_bill_no", "")

        # Build transport block (only if any field is present)
        if any([mode, vehicle, lr_no, eway]):
            transport_html = (
                "\n    <div class=\"pdf-meta-inline logistics\">\n"
                f"      <div><span class=\"u-muted\">Mode<\/span><div class=\"u-bold\">{mode}<\/div><\/div>\n"
                f"      <div><span class=\"u-muted\">Vehicle<\/span><div class=\"u-bold\">{vehicle}<\/div><\/div>\n"
                f"      <div><span class=\"u-muted\">LR No<\/span><div class=\"u-bold\">{lr_no}<\/div><\/div>\n"
                f"      <div><span class=\"u-muted\">E-Way Bill<\/span><div class=\"u-bold\">{eway}<\/div><\/div>\n"
                "    <\/div>\n"
            )
            # Insert before parties section
            base_html = base_html.replace("<div class=\"pdf-parties\">", transport_html + "\n    <div class=\"pdf-parties\">")

        return base_html
    
    def _generate_gst_simple_html(self, data: Dict[str, Any], columns: List[Dict], paper_size: str) -> str:
        """Generate GST Simple template HTML (list-style, inline meta)"""
        supplier = data.get("supplier", {})
        invoice = data.get("invoice", {})
        customer = data.get("customer", {})
        ship_to = data.get("ship_to", {})
        items = data.get("items", [])
        charges = data.get("charges", [])

        # Header + inline meta
        html = f"""
<div class="pdf-page {paper_size}">
  <div class="pdf-header">
    <div class="pdf-brand">
      {f'<img class="pdf-logo" src="{supplier.get("logo_url", "")}" />' if supplier.get("logo_url") else ''}
      <div class="pdf-supplier">
        <h1>{supplier.get("legal_name", "")}</h1>
        {f'<div class="trade">{supplier.get("trade_name", "")}</div>' if supplier.get("trade_name") else ''}
        <div class="addr">{self._format_address(supplier.get("address", {}))}</div>
        <div class="contact">
          {f'<div class="line u-muted">GSTIN: {supplier.get("gstin", "")}</div>' if supplier.get("gstin") else ''}
        </div>
      </div>
    </div>
    <div class="pdf-meta-inline">
      <div><span class="u-muted">Invoice #</span><div class="u-bold">{invoice.get("number", "")}</div></div>
      <div><span class="u-muted">Date</span><div class="u-bold">{invoice.get("date", "")}</div></div>
      <div><span class="u-muted">PoS</span><div class="u-bold">{self._format_place_of_supply(invoice.get("place_of_supply", {}))}</div></div>
    </div>
  </div>

  <div class="pdf-parties">
    <div class="party-card">
      <div class="title">Bill To</div>
      <div class="line">{customer.get("name", "")}</div>
      <div class="line u-muted">GSTIN: {customer.get("gstin", "")}</div>
      <div class="line">{self._format_address(customer.get("address", {}))}</div>
    </div>
    <div class="party-card">
      <div class="title">Ship To</div>
      <div class="line">{"Same as Bill To" if ship_to.get("use_bill_to", True) else ship_to.get("name", "")}</div>
      {'' if ship_to.get("use_bill_to", True) else f'<div class="line">{self._format_address(ship_to.get("address", {}))}</div>'}
    </div>
  </div>

  <div class="u-mt-md">
    <div class="u-bold">Items</div>
    <div>
"""
        # Items as list
        for i, item in enumerate(items, 1):
            qty = item.get("quantity", 0)
            rate = item.get("unit_price", 0)
            discount = self._calculate_discount(item.get("discount", {}), qty * rate)
            taxable_value = max(0, (qty * rate) - discount)
            tax_rate = item.get("tax", {}).get("rate", 0)
            tax_note = f"{tax_rate}% GST" if tax_rate else "No GST"
            html += f"""
      <div class="u-mt-sm">
        <div class="u-bold">{i}. {item.get("description", "")}{' ('+item.get('hsn_sac','')+')' if item.get('hsn_sac') else ''}</div>
        <div class="u-muted">Qty x Rate: {qty} {item.get('uqc','')} x {rate:.2f}</div>
        <div>Taxable: ₹{taxable_value:.2f} · Tax: {tax_note}</div>
      </div>
"""

        # Totals
        totals = self._calculate_totals(items, charges, True)
        html += f"""
    </div>
  </div>

  <div class="pdf-totals">
    <div class="row"><div class="label">Taxable Subtotal</div><div class="value">₹{totals["taxable_subtotal"]:.2f}</div></div>
    <div class="row"><div class="label">Total GST</div><div class="value">₹{totals["gst_total"]:.2f}</div></div>
    <div class="row grand"><div class="label">Grand Total</div><div class="value">₹{totals["grand_total"]:.2f}</div></div>
  </div>

  <div class="pdf-amount-words">Amount in words: {self._number_to_words(totals["grand_total"])}</div>

  <div class="pdf-sign">
    <div class="sig-box">
      <div class="sig-label">Authorized Signatory</div>
    </div>
    <div class="seal"></div>
  </div>
</div>
"""
        return html
    
    def _generate_gst_detailed_html(self, data: Dict[str, Any], columns: List[Dict], paper_size: str) -> str:
        """Generate GST Detailed template HTML with GST summary box"""
        html = self._generate_gst_tabular_html(data, columns, paper_size)
        
        # Add GST summary box before totals
        totals = self._calculate_totals(data.get("items", []), data.get("charges", []), True)
        
        gst_summary = f"""
    <div class="gst-summary-box">
        <div class="gst-row"><div>Taxable Value (Goods)</div><div class="u-bold">₹{totals["goods_taxable"]:.2f}</div></div>
        <div class="gst-row"><div>Taxable Value (Services)</div><div class="u-bold">₹{totals["services_taxable"]:.2f}</div></div>
        <div class="gst-row"><div>CGST</div><div class="u-bold">₹{totals["cgst_total"]:.2f}</div></div>
        <div class="gst-row"><div>SGST</div><div class="u-bold">₹{totals["sgst_total"]:.2f}</div></div>
        <div class="gst-row"><div>IGST</div><div class="u-bold">₹{totals["igst_total"]:.2f}</div></div>
        <div class="gst-row"><div>Cess</div><div class="u-bold">₹{totals["cess_total"]:.2f}</div></div>
        <div class="gst-row"><div>Total GST</div><div class="u-bold">₹{totals["gst_total"]:.2f}</div></div>
    </div>
"""
        
        # Insert GST summary before totals
        html = html.replace('<div class="pdf-totals">', gst_summary + '\n    <div class="pdf-totals">')
        
        return html
    
    def _generate_nongst_simple_html(self, data: Dict[str, Any], columns: List[Dict], paper_size: str) -> str:
        """Generate Non-GST Simple template HTML (list-style, minimal)"""
        supplier = data.get("supplier", {})
        invoice = data.get("invoice", {})
        customer = data.get("customer", {})
        items = data.get("items", [])
        charges = data.get("charges", [])

        html = f"""
<div class="pdf-page {paper_size}">
  <div class="pdf-header">
    <div class="pdf-brand">
      {f'<img class="pdf-logo" src="{supplier.get("logo_url", "")}" />' if supplier.get("logo_url") else ''}
      <div class="pdf-supplier">
        <h1>{supplier.get("legal_name", "")}</h1>
        <div class="addr">{self._format_address(supplier.get("address", {}))}</div>
        <div class="contact">
          {f'<div class="line u-muted">PAN: {supplier.get("pan", "")}</div>' if supplier.get("pan") else ''}
        </div>
      </div>
    </div>
    <div class="pdf-meta-inline">
      <div><span class="u-muted">Invoice #</span><div class="u-bold">{invoice.get("number", "")}</div></div>
      <div><span class="u-muted">Date</span><div class="u-bold">{invoice.get("date", "")}</div></div>
      <div><span class="u-muted">Due</span><div class="u-bold">{invoice.get("due_date", "")}</div></div>
    </div>
  </div>

  <div class="party-card u-mt-md">
    <div class="title">Bill To</div>
    <div class="line">{customer.get("name", "")}</div>
    <div class="line">{self._format_address(customer.get("address", {}))}</div>
  </div>

  <div class="u-mt-md">
    <div class="u-bold">Items</div>
"""
        for i, item in enumerate(items, 1):
            qty = item.get("quantity", 0)
            rate = item.get("unit_price", 0)
            discount = self._calculate_discount(item.get("discount", {}), qty * rate)
            line_amount = max(0, (qty * rate) - discount)
            html += f"""
    <div class="u-mt-sm">
      <div class="u-bold">{i}. {item.get("description", "")}</div>
      <div class="u-muted">Qty x Rate: {qty} {item.get('uqc','')} x {rate:.2f}</div>
      <div>Amount: ₹{line_amount:.2f}</div>
    </div>
"""

        # Compute simple totals
        totals = self._calculate_totals(items, charges, True)
        html += f"""
  </div>

  <div class="pdf-totals">
    <div class="row"><div class="label">Subtotal</div><div class="value">₹{totals["taxable_subtotal"]:.2f}</div></div>
    <div class="row grand"><div class="label">Total Payable</div><div class="value">₹{totals["grand_total"]:.2f}</div></div>
  </div>

  <div class="pdf-amount-words">Amount in words: {self._number_to_words(totals["grand_total"])}</div>

  <div class="pdf-sign">
    <div class="sig-box">
      <div class="sig-label">Authorized Signatory</div>
    </div>
    <div class="seal"></div>
  </div>
</div>
"""
        return html
    
    def _generate_nongst_tabular_html(self, data: Dict[str, Any], columns: List[Dict], paper_size: str) -> str:
        """Generate Non-GST Tabular template HTML (no GST fields)"""
        supplier = data.get("supplier", {})
        invoice = data.get("invoice", {})
        customer = data.get("customer", {})
        ship_to = data.get("ship_to", {})
        items = data.get("items", [])
        charges = data.get("charges", [])

        # Header
        html = f"""
<div class=\"pdf-page {paper_size}\">\n
  <div class=\"pdf-header\">\n
    <div class=\"pdf-brand\">\n
      {f'<img class=\"pdf-logo\" src=\"{supplier.get("logo_url", "")}\" />' if supplier.get("logo_url") else ''}\n
      <div class=\"pdf-supplier\">\n
        <h1>{supplier.get("legal_name", "")}</h1>\n
        {f'<div class=\"trade\">{supplier.get("trade_name", "")}<\/div>' if supplier.get("trade_name") else ''}\n
        <div class=\"addr\">{self._format_address(supplier.get("address", {}))}</div>\n
        <div class=\"contact\">\n
          {f'<div class=\"line u-muted\">PAN: {supplier.get("pan", "")}<\/div>' if supplier.get("pan") else ''}\n
        </div>\n
      </div>\n
    </div>\n
    <div class=\"pdf-invmeta\">\n
      <div class=\"title\">{invoice.get("title", "Invoice")}</div>\n
      <div class=\"row\"><span class=\"key\">Invoice #:<\/span><span class=\"val\">{invoice.get("number", "")}<\/span></div>\n
      <div class=\"row\"><span class=\"key\">Date:<\/span><span class=\"val\">{invoice.get("date", "")}<\/span></div>\n
      <div class=\"row\"><span class=\"key\">Due:<\/span><span class=\"val\">{invoice.get("due_date", "")}<\/span></div>\n
    </div>\n
  </div>\n
"""

        # Parties
        html += f"""
  <div class=\"pdf-parties\">\n
    <div class=\"party-card\">\n
      <div class=\"title\">Bill To</div>\n
      <div class=\"line\">{customer.get("name", "")}</div>\n
      <div class=\"line\">{self._format_address(customer.get("address", {}))}</div>\n
    </div>\n
    <div class=\"party-card\">\n
      <div class=\"title\">Ship To</div>\n
      <div class=\"line\">{"Same as Bill To" if ship_to.get("use_bill_to", True) else ship_to.get("name", "")}</div>\n
      {'' if ship_to.get("use_bill_to", True) else f'<div class=\\"line\\">{self._format_address(ship_to.get("address", {}))}<\/div>'}\n
    </div>\n
  </div>\n
"""

        # Table header
        html += """
  <table class=\"pdf-table items striped\">\n
    <thead>\n
      <tr>\n
"""
        for col in columns:
            html += f'        <th class="{col["class"]}">{col["label"]}</th>\n'

        html += """
      </tr>\n
    </thead>\n
    <tbody>\n
"""

        # Rows and totals (no GST)
        subtotal = 0.0
        for i, item in enumerate(items, 1):
            qty = item.get("quantity", 0)
            rate = item.get("unit_price", 0)
            discount = self._calculate_discount(item.get("discount", {}), qty * rate)
            line_amount = max(0, (qty * rate) - discount)
            subtotal += line_amount

            html += (
                "      <tr>\n"
                f"        <td>{i}</td>\n"
                f"        <td>{item.get('description', '')}</td>\n"
                f"        <td class=\"num\">{qty}</td>\n"
                f"        <td>{item.get('uqc', '')}</td>\n"
                f"        <td class=\"num\">{rate:.2f}</td>\n"
                f"        <td class=\"num\">{discount:.2f}</td>\n"
                f"        <td class=\"num\">{line_amount:.2f}</td>\n"
                "      </tr>\n"
            )

        html += """
    </tbody>\n
  </table>\n
"""

        # Totals (Subtotal + charges => Total Payable)
        charges_total = 0.0
        for ch in charges:
            charges_total += ch.get("amount", 0) or 0
        grand_total = subtotal + charges_total

        html += f"""
  <div class=\"pdf-totals\">\n
    <div class=\"row\"><div class=\"label\">Subtotal</div><div class=\"value\">₹{subtotal:.2f}</div></div>\n
    <div class=\"row grand\"><div class=\"label\">Total Payable</div><div class=\"value\">₹{grand_total:.2f}</div></div>\n
  </div>\n
"""

        # Amount in words and signature
        html += f"""
  <div class=\"pdf-amount-words\">Amount in words: {self._number_to_words(grand_total)}</div>\n
  <div class=\"pdf-sign\">\n
    <div class=\"sig-box\">\n
      <div class=\"sig-label\">Authorized Signatory</div>\n
    </div>\n
    <div class=\"seal\"></div>\n
  </div>\n
</div>\n
"""

        return html
    
    def _format_address(self, address: Dict[str, Any]) -> str:
        """Format address dictionary to string"""
        parts = []
        if address.get("line1"):
            parts.append(address["line1"])
        if address.get("line2"):
            parts.append(address["line2"])
        if address.get("city"):
            parts.append(address["city"])
        if address.get("state"):
            parts.append(address["state"])
        if address.get("pin"):
            parts.append(address["pin"])
        return ", ".join(parts)
    
    def _format_place_of_supply(self, pos: Dict[str, Any]) -> str:
        """Format place of supply"""
        if pos.get("state"):
            return f"{pos['state']} ({pos.get('state_code', '')})"
        return ""
    
    def _calculate_discount(self, discount: Dict[str, Any], base_amount: float) -> float:
        """Calculate discount amount"""
        if not discount:
            return 0
        
        discount_type = discount.get("type", "AMOUNT")
        discount_value = discount.get("value", 0)
        
        if discount_type == "PERCENT":
            return base_amount * discount_value / 100
        else:
            return discount_value
    
    def _calculate_totals(self, items: List[Dict], charges: List[Dict], is_intra_state: bool) -> Dict[str, float]:
        """Calculate invoice totals"""
        taxable_subtotal = 0
        cgst_total = 0
        sgst_total = 0
        igst_total = 0
        cess_total = 0
        goods_taxable = 0
        services_taxable = 0
        
        for item in items:
            qty = item.get("quantity", 0)
            rate = item.get("unit_price", 0)
            discount = self._calculate_discount(item.get("discount", {}), qty * rate)
            taxable_value = max(0, (qty * rate) - discount)
            tax_rate = item.get("tax", {}).get("rate", 0)
            cess_rate = item.get("tax", {}).get("cess_rate", 0)
            is_service = item.get("is_service", False)
            
            if is_service:
                services_taxable += taxable_value
            else:
                goods_taxable += taxable_value
            
            taxable_subtotal += taxable_value
            
            if is_intra_state:
                cgst_total += taxable_value * (tax_rate / 2) / 100
                sgst_total += taxable_value * (tax_rate / 2) / 100
            else:
                igst_total += taxable_value * tax_rate / 100
            
            cess_total += taxable_value * cess_rate / 100
        
        # Add charges
        for charge in charges:
            amount = charge.get("amount", 0)
            if charge.get("taxable", False):
                tax_rate = charge.get("tax_rate", 0)
                taxable_subtotal += amount
                
                if is_intra_state:
                    cgst_total += amount * (tax_rate / 2) / 100
                    sgst_total += amount * (tax_rate / 2) / 100
                else:
                    igst_total += amount * tax_rate / 100
            else:
                # Non-taxable charges are added after tax calculation
                pass
        
        grand_total = taxable_subtotal + cgst_total + sgst_total + igst_total + cess_total
        
        # Add non-taxable charges
        for charge in charges:
            if not charge.get("taxable", False):
                grand_total += charge.get("amount", 0)
        
        return {
            "taxable_subtotal": taxable_subtotal,
            "cgst_total": cgst_total,
            "sgst_total": sgst_total,
            "igst_total": igst_total,
            "cess_total": cess_total,
            "grand_total": grand_total,
            "gst_total": cgst_total + sgst_total + igst_total,
            "goods_taxable": goods_taxable,
            "services_taxable": services_taxable
        }
    
    def _number_to_words(self, number: float) -> str:
        """Convert number to words (simplified version)"""
        # This is a simplified implementation
        # In production, you'd want a more comprehensive number-to-words converter
        return f"Rupees {number:.2f} Only"
