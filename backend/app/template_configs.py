"""
GST Invoice Template Configurations
Contains the 5 pre-defined templates as specified in the JSON schema
"""

import json
from typing import Dict, Any

# Core Data Model (shared across templates)
CORE_DATA_MODEL = {
    "supplier": {
        "legal_name": "string",
        "trade_name": "string|null",
        "address": {
            "line1": "string",
            "line2": "string|null",
            "city": "string",
            "state": "string",
            "state_code": "string",
            "pin": "string"
        },
        "gstin": "string|null",
        "pan": "string|null",
        "contact": {"phone": "string|null", "email": "string|null"},
        "logo_url": "string|null",
        "bank": {
            "bank_name": "string|null",
            "account_name": "string|null",
            "account_number": "string|null",
            "ifsc": "string|null",
            "upi_id": "string|null"
        }
    },
    "invoice": {
        "title": "string",
        "number": "string",
        "date": "string",
        "due_date": "string|null",
        "currency": "string",
        "reverse_charge": "boolean",
        "po_number": "string|null",
        "eway_bill_no": "string|null",
        "transport": {
            "mode": "string|null",
            "vehicle_no": "string|null",
            "lr_no": "string|null"
        },
        "e_invoicing": {
            "applicable": "boolean",
            "irn": "string|null",
            "ack_no": "string|null",
            "ack_date": "string|null",
            "qr_code_data": "string|null"
        },
        "place_of_supply": {"state": "string", "state_code": "string"}
    },
    "customer": {
        "name": "string",
        "gstin": "string|null",
        "address": {
            "line1": "string",
            "line2": "string|null",
            "city": "string",
            "state": "string",
            "state_code": "string",
            "pin": "string"
        },
        "contact": {"phone": "string|null", "email": "string|null"}
    },
    "ship_to": {
        "use_bill_to": "boolean",
        "name": "string|null",
        "address": {
            "line1": "string|null",
            "line2": "string|null",
            "city": "string|null",
            "state": "string|null",
            "state_code": "string|null",
            "pin": "string|null"
        }
    },
    "config": {
        "prior_fy_aggregate_turnover_gt_5cr": "boolean",
        "language": "string",
        "decimal_places": 2,
        "rounding": "HALF_UP",
        "paper_size": "A4|A5"
    },
    "items": [
        {
            "sl_no": "number",
            "description": "string",
            "hsn_sac": "string|null",
            "quantity": "number",
            "uqc": "string",
            "unit_price": "number",
            "discount": {"type": "PERCENT|AMOUNT", "value": "number"},
            "tax": {"rate": "number", "cess_rate": "number"},
            "is_service": "boolean"
        }
    ],
    "charges": [
        {
            "name": "string",
            "amount": "number",
            "taxable": "boolean",
            "tax_rate": "number"
        }
    ],
    "notes": ["string"],
    "declaration": "string|null",
    "signatory": {"name": "string|null", "designation": "string|null", "place": "string|null"}
}

# Template 1: GST + Tabular (Standard Tax Invoice)
GST_TABULAR_TEMPLATE = {
    "template_id": "GST_TABULAR_A4A5_V1",
    "requires": {
        "gst": True,
        "title": "Tax Invoice",
        "hsn_required": True
    },
    "validation": {
        "invoice_number_max_len": 16,
        "unique_invoice_number_per_fy": True,
        "supplier_gstin_required": True,
        "customer_gstin_required_for_b2b": True,
        "place_of_supply_required": True,
        "hsn_digits": {
            "gt_5cr": 6,
            "lte_5cr_b2b": 4,
            "b2c_optional": True
        }
    },
    "tax_logic": {
        "split": "auto",
        "rules": [
            {
                "if": {"supplier.state_code_equals_pos": True},
                "then": {"apply": ["CGST", "SGST"], "disallow": ["IGST"]}
            },
            {
                "if": {"supplier.state_code_equals_pos": False},
                "then": {"apply": ["IGST"], "disallow": ["CGST", "SGST"]}
            }
        ]
    },
    "layout": {
        "paper": {"A4": {"font_pt": 10, "margins_mm": 15}, "A5": {"font_pt": 9, "margins_mm": 10}},
        "sections": [
            {
                "id": "header",
                "type": "block",
                "fields": [
                    "invoice.title",
                    "supplier.legal_name",
                    "supplier.trade_name",
                    "supplier.address",
                    "supplier.gstin",
                    "supplier.contact",
                    "supplier.logo_url",
                    {"key": "invoice.e_invoicing", "show_if": "invoice.e_invoicing.applicable"}
                ]
            },
            {
                "id": "meta",
                "type": "grid",
                "columns": 2,
                "fields": [
                    "invoice.number",
                    "invoice.date",
                    "invoice.due_date",
                    "invoice.reverse_charge",
                    "invoice.po_number",
                    "invoice.eway_bill_no",
                    "invoice.place_of_supply"
                ]
            },
            {
                "id": "parties",
                "type": "grid",
                "columns": 2,
                "blocks": [
                    {"title": "Bill To", "fields": ["customer.name", "customer.gstin", "customer.address"]},
                    {"title": "Ship To", "fields": ["ship_to", "ship_to.address"], "show_if": "!ship_to.use_bill_to"}
                ]
            },
            {
                "id": "items_table",
                "type": "table",
                "responsive": {
                    "A4": ["sl_no", "description", "hsn_sac", "quantity", "uqc", "unit_price", "discount", "taxable_value", "cgst", "sgst", "igst", "line_total"],
                    "A5": ["sl_no", "description", "hsn_sac", "quantity", "unit_price", "taxable_value", "tax_split", "line_total"]
                },
                "columns": {
                    "sl_no": {"label": "Sl. No.", "from": "items.sl_no"},
                    "description": {"label": "Description", "from": "items.description"},
                    "hsn_sac": {"label": "HSN/SAC", "from": "items.hsn_sac"},
                    "quantity": {"label": "Qty", "from": "items.quantity"},
                    "uqc": {"label": "UQC", "from": "items.uqc", "A4_only": True},
                    "unit_price": {"label": "Rate", "from": "items.unit_price"},
                    "discount": {"label": "Discount", "from": "items.discount", "format": "compact"},
                    "taxable_value": {
                        "label": "Taxable Value",
                        "computed": True,
                        "formula": "quantity * unit_price - discount_applied"
                    },
                    "cgst": {
                        "label": "CGST",
                        "computed": True,
                        "show_if": "supplier.state_code == invoice.place_of_supply.state_code",
                        "formula": "taxable_value * (items.tax.rate/2)/100"
                    },
                    "sgst": {
                        "label": "SGST",
                        "computed": True,
                        "show_if": "supplier.state_code == invoice.place_of_supply.state_code",
                        "formula": "taxable_value * (items.tax.rate/2)/100"
                    },
                    "igst": {
                        "label": "IGST",
                        "computed": True,
                        "show_if": "supplier.state_code != invoice.place_of_supply.state_code",
                        "formula": "taxable_value * items.tax.rate/100"
                    },
                    "tax_split": {"label": "Tax", "computed": True, "A5_only": True},
                    "line_total": {
                        "label": "Line Total",
                        "computed": True,
                        "formula": "taxable_value + cgst + sgst + igst"
                    }
                }
            },
            {
                "id": "summary",
                "type": "totals",
                "rows": [
                    {"label": "Subtotal (Taxable)", "key": "subtotal_taxable", "computed": True, "formula": "sum(items.taxable_value)+sum(taxable_charges)"},
                    {"label": "CGST Total", "key": "cgst_total", "computed": True},
                    {"label": "SGST Total", "key": "sgst_total", "computed": True},
                    {"label": "IGST Total", "key": "igst_total", "computed": True},
                    {"label": "Cess Total", "key": "cess_total", "computed": True},
                    {"label": "Round-off", "key": "round_off", "computed": True, "formula": "rounding(grand_total)-grand_total"},
                    {"label": "Invoice Total (INR)", "key": "grand_total", "computed": True, "emphasis": True}
                ],
                "amount_in_words": {"key": "amount_in_words", "computed": True}
            },
            {
                "id": "payment",
                "type": "block",
                "title": "Payment Details",
                "fields": ["supplier.bank"]
            },
            {"id": "notes", "type": "list", "title": "Notes", "fields": ["notes"]},
            {
                "id": "sign",
                "type": "block",
                "title": "Authorized Signatory",
                "fields": ["signatory", "signatory.place"]
            }
        ]
    }
}

# Template 2: GST + Simple (Compact, non-tabular)
GST_SIMPLE_TEMPLATE = {
    "template_id": "GST_SIMPLE_A5A4_V1",
    "requires": {"gst": True, "title": "Tax Invoice"},
    "validation": {"inherit": "GST_TABULAR_A4A5_V1.validation"},
    "tax_logic": {"inherit": "GST_TABULAR_A4A5_V1.tax_logic"},
    "layout": {
        "paper": {"A5": {"font_pt": 9, "margins_mm": 8}, "A4": {"font_pt": 10, "margins_mm": 12}},
        "sections": [
            {
                "id": "header",
                "type": "block",
                "fields": [
                    "invoice.title",
                    "supplier.legal_name",
                    "supplier.address",
                    "supplier.gstin",
                    {"key": "invoice.e_invoicing", "show_if": "invoice.e_invoicing.applicable"}
                ]
            },
            {
                "id": "meta_inline",
                "type": "inline",
                "fields": [
                    "invoice.number",
                    "invoice.date",
                    "invoice.due_date",
                    "invoice.reverse_charge",
                    "invoice.place_of_supply"
                ]
            },
            {
                "id": "parties",
                "type": "grid",
                "columns": 2,
                "blocks": [
                    {"title": "Bill To", "fields": ["customer.name", "customer.gstin", "customer.address"]},
                    {"title": "Ship To", "fields": ["ship_to", "ship_to.address"], "show_if": "!ship_to.use_bill_to"}
                ]
            },
            {
                "id": "items_list",
                "type": "repeat",
                "item_layout": [
                    {"label": "Item", "from": "items.sl_no"},
                    {"label": "Description (HSN/SAC)", "computed": True, "formula": "description + (hsn_sac? ' ('+hsn_sac+')':'')"},
                    {"label": "Qty x Rate", "computed": True, "formula": "quantity + ' ' + uqc + ' x ' + unit_price"},
                    {"label": "Taxable Value", "computed": True, "formula": "quantity*unit_price - discount_applied"},
                    {"label": "Tax", "computed": True, "formula": "CGST/SGST or IGST breakdown"},
                    {"label": "Line Total", "computed": True}
                ]
            },
            {"id": "summary", "type": "inherit", "from_template": "GST_TABULAR_A4A5_V1.summary"},
            {"id": "payment", "type": "block", "fields": ["supplier.bank"]},
            {"id": "sign", "type": "block", "fields": ["signatory"]}
        ]
    }
}

# Template 3: GST + Detailed GST Section + Tabular
GST_DETAILED_SECTION_TEMPLATE = {
    "template_id": "GST_DETAILED_SECTION_A4_V1",
    "requires": {"gst": True, "title": "Tax Invoice"},
    "validation": {"inherit": "GST_TABULAR_A4A5_V1.validation"},
    "tax_logic": {"inherit": "GST_TABULAR_A4A5_V1.tax_logic"},
    "layout": {
        "paper": {"A4": {"font_pt": 10, "margins_mm": 15}, "A5": {"font_pt": 9, "margins_mm": 10}},
        "sections": [
            {"id": "header", "type": "inherit", "from_template": "GST_TABULAR_A4A5_V1.header"},
            {"id": "meta", "type": "inherit", "from_template": "GST_TABULAR_A4A5_V1.meta"},
            {"id": "parties", "type": "inherit", "from_template": "GST_TABULAR_A4A5_V1.parties"},
            {
                "id": "items_table",
                "type": "table",
                "columns": {
                    "sl_no": {"label": "Sl. No."},
                    "description": {"label": "Description of Goods/Services"},
                    "hsn_sac": {"label": "HSN/SAC"},
                    "quantity": {"label": "Qty"},
                    "uqc": {"label": "UQC"},
                    "unit_price": {"label": "Unit Price"},
                    "discount": {"label": "Discount"},
                    "taxable_value": {"label": "Taxable Value", "computed": True},
                    "rate_cgst": {"label": "CGST %", "computed": True},
                    "rate_sgst": {"label": "SGST %", "computed": True},
                    "rate_igst": {"label": "IGST %", "computed": True},
                    "amt_cgst": {"label": "CGST Amt", "computed": True},
                    "amt_sgst": {"label": "SGST Amt", "computed": True},
                    "amt_igst": {"label": "IGST Amt", "computed": True},
                    "amt_cess": {"label": "Cess Amt", "computed": True},
                    "line_total": {"label": "Line Total", "computed": True}
                }
            },
            {
                "id": "gst_section",
                "type": "box",
                "title": "GST Summary",
                "rows": [
                    {"label": "Taxable Value (Goods)", "computed": True, "formula": "sum(items.taxable_value where !is_service)"},
                    {"label": "Taxable Value (Services)", "computed": True, "formula": "sum(items.taxable_value where is_service)"},
                    {"label": "CGST by Rate", "computed": True, "formula": "group_sum(items by (items.tax.rate/2))"},
                    {"label": "SGST by Rate", "computed": True, "formula": "group_sum(items by (items.tax.rate/2))"},
                    {"label": "IGST by Rate", "computed": True, "formula": "group_sum(items by (items.tax.rate))"},
                    {"label": "Cess Total", "computed": True},
                    {"label": "Total GST", "computed": True}
                ],
                "reverse_charge_note": {"show_if": "invoice.reverse_charge", "text": "Tax to be paid by recipient under reverse charge."}
            },
            {"id": "summary", "type": "inherit", "from_template": "GST_TABULAR_A4A5_V1.summary"},
            {"id": "payment", "type": "block", "fields": ["supplier.bank"]},
            {
                "id": "declarations",
                "type": "block",
                "fields": [
                    {"key": "declaration", "default": "We declare that this invoice shows the actual price and particulars are true and correct. Subject to Lucknow jurisdiction."}
                ]
            },
            {"id": "sign", "type": "block", "fields": ["signatory"]}
        ]
    }
}

# Template 4: Without GST – Simple
NONGST_SIMPLE_TEMPLATE = {
    "template_id": "NONGST_SIMPLE_A5_V1",
    "requires": {"gst": False, "title": "Invoice"},
    "validation": {
        "supplier_gstin_required": False,
        "hsn_required": False
    },
    "layout": {
        "paper": {"A5": {"font_pt": 9, "margins_mm": 8}, "A4": {"font_pt": 10, "margins_mm": 12}},
        "sections": [
            {
                "id": "header",
                "type": "block",
                "fields": [
                    "invoice.title",
                    "supplier.legal_name",
                    "supplier.address",
                    "supplier.pan",
                    "supplier.contact"
                ]
            },
            {
                "id": "meta",
                "type": "inline",
                "fields": ["invoice.number", "invoice.date", "invoice.due_date", "invoice.po_number"]
            },
            {
                "id": "customer",
                "type": "block",
                "title": "Bill To",
                "fields": ["customer.name", "customer.address", "customer.contact"]
            },
            {
                "id": "items_simple",
                "type": "repeat",
                "item_layout": [
                    {"label": "Sl.", "from": "items.sl_no"},
                    {"label": "Description", "from": "items.description"},
                    {"label": "Qty x Rate", "computed": True, "formula": "quantity + ' ' + uqc + ' x ' + unit_price"},
                    {"label": "Line Amount", "computed": True, "formula": "(quantity * unit_price) - discount_applied"}
                ]
            },
            {
                "id": "totals",
                "type": "totals",
                "rows": [
                    {"label": "Subtotal", "computed": True, "key": "subtotal"},
                    {"label": "Other Charges", "computed": True, "key": "other_charges"},
                    {"label": "Round-off", "computed": True, "key": "round_off"},
                    {"label": "Total Payable (INR)", "computed": True, "key": "total", "emphasis": True}
                ],
                "amount_in_words": {"key": "amount_in_words", "computed": True}
            },
            {"id": "payment", "type": "block", "fields": ["supplier.bank"]},
            {"id": "sign", "type": "block", "fields": ["signatory"]}
        ]
    }
}

# Template 5: Without GST – Tabular
NONGST_TABULAR_TEMPLATE = {
    "template_id": "NONGST_TABULAR_A4A5_V1",
    "requires": {"gst": False, "title": "Invoice"},
    "validation": {"supplier_gstin_required": False, "hsn_required": False},
    "layout": {
        "paper": {"A4": {"font_pt": 10, "margins_mm": 15}, "A5": {"font_pt": 9, "margins_mm": 10}},
        "sections": [
            {
                "id": "header",
                "type": "grid",
                "columns": 2,
                "fields": [
                    "invoice.title",
                    "supplier.legal_name",
                    "supplier.address",
                    "supplier.pan",
                    "supplier.contact",
                    "supplier.logo_url"
                ]
            },
            {
                "id": "meta",
                "type": "inline",
                "fields": ["invoice.number", "invoice.date", "invoice.due_date", "invoice.po_number"]
            },
            {
                "id": "customer",
                "type": "block",
                "title": "Customer",
                "fields": ["customer.name", "customer.address", "customer.contact"]
            },
            {
                "id": "items_table",
                "type": "table",
                "columns": {
                    "sl_no": {"label": "Sl. No.", "from": "items.sl_no"},
                    "description": {"label": "Description", "from": "items.description"},
                    "quantity": {"label": "Qty", "from": "items.quantity"},
                    "uqc": {"label": "Unit", "from": "items.uqc"},
                    "unit_price": {"label": "Rate", "from": "items.unit_price"},
                    "discount": {"label": "Discount", "from": "items.discount"},
                    "line_amount": {
                        "label": "Line Amount",
                        "computed": True,
                        "formula": "(quantity * unit_price) - discount_applied"
                    }
                }
            },
            {
                "id": "totals",
                "type": "totals",
                "rows": [
                    {"label": "Subtotal", "key": "subtotal", "computed": True},
                    {"label": "Other Charges", "key": "other_charges", "computed": True},
                    {"label": "Round-off", "key": "round_off", "computed": True},
                    {"label": "Total Payable (INR)", "key": "total", "computed": True, "emphasis": True}
                ],
                "amount_in_words": {"key": "amount_in_words", "computed": True}
            },
            {"id": "payment", "type": "block", "fields": ["supplier.bank"]},
            {"id": "sign", "type": "block", "fields": ["signatory"]}
        ]
    }
}

# All templates dictionary
GST_INVOICE_TEMPLATES = {
    "GST_TABULAR_A4A5_V1": {
        "name": "GST Tabular (A4/A5)",
        "description": "Standard GST tax invoice with detailed tabular format. Supports both A4 and A5 paper sizes.",
        "template_config": json.dumps(GST_TABULAR_TEMPLATE),
        "requires_gst": True,
        "requires_hsn": True,
        "title": "Tax Invoice",
        "paper_sizes": "A4,A5",
        "sort_order": 1
    },
    "GST_SIMPLE_A5A4_V1": {
        "name": "GST Simple (A5/A4)",
        "description": "Compact GST invoice format, ideal for quick invoices. Optimized for A5 with A4 fallback.",
        "template_config": json.dumps(GST_SIMPLE_TEMPLATE),
        "requires_gst": True,
        "requires_hsn": True,
        "title": "Tax Invoice",
        "paper_sizes": "A5,A4",
        "sort_order": 2
    },
    "GST_DETAILED_SECTION_A4_V1": {
        "name": "GST Detailed Section (A4)",
        "description": "Comprehensive GST invoice with detailed tax breakdown section. A4 format only.",
        "template_config": json.dumps(GST_DETAILED_SECTION_TEMPLATE),
        "requires_gst": True,
        "requires_hsn": True,
        "title": "Tax Invoice",
        "paper_sizes": "A4",
        "sort_order": 3
    },
    "NONGST_SIMPLE_A5_V1": {
        "name": "Non-GST Simple (A5)",
        "description": "Simple invoice format without GST requirements. Perfect for small businesses.",
        "template_config": json.dumps(NONGST_SIMPLE_TEMPLATE),
        "requires_gst": False,
        "requires_hsn": False,
        "title": "Invoice",
        "paper_sizes": "A5,A4",
        "sort_order": 4
    },
    "NONGST_TABULAR_A4A5_V1": {
        "name": "Non-GST Tabular (A4/A5)",
        "description": "Professional tabular invoice format without GST. Supports both A4 and A5 paper sizes.",
        "template_config": json.dumps(NONGST_TABULAR_TEMPLATE),
        "requires_gst": False,
        "requires_hsn": False,
        "title": "Invoice",
        "paper_sizes": "A4,A5",
        "sort_order": 5
    }
}

def get_template_config(template_id: str) -> Dict[str, Any]:
    """Get template configuration by template ID"""
    if template_id in GST_INVOICE_TEMPLATES:
        return json.loads(GST_INVOICE_TEMPLATES[template_id]["template_config"])
    raise ValueError(f"Template {template_id} not found")

def get_all_templates() -> Dict[str, Dict[str, Any]]:
    """Get all available templates"""
    return GST_INVOICE_TEMPLATES

def get_template_metadata(template_id: str) -> Dict[str, Any]:
    """Get template metadata by template ID"""
    if template_id in GST_INVOICE_TEMPLATES:
        return GST_INVOICE_TEMPLATES[template_id]
    raise ValueError(f"Template {template_id} not found")
