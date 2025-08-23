"""
PDF Design Tokens for GST Invoice Templates
Contains all design tokens for consistent PDF styling across all templates
"""

# Design Tokens for PDF Rendering
PDF_DESIGN_TOKENS = {
    "tokens": {
        "colors": {
            "ink": "#1B1F24",
            "muted": "#5B6675",
            "border": "#D9DEE5",
            "border_soft": "#EDEFF3",
            "bg": "#FFFFFF",
            "bg_alt": "#F7F9FC",
            "primary": "#1E40AF",
            "accent": "#0EA5E9",
            "success": "#0F9D58",
            "danger": "#DC2626"
        },
        "font": {
            "family": "'Inter', 'Noto Sans', Arial, sans-serif",
            "base_pt": {"A4": 10, "A5": 9},
            "h6_pt": {"A4": 11, "A5": 10},
            "h5_pt": {"A4": 12, "A5": 11},
            "mono_family": "'JetBrains Mono','Fira Mono', monospace"
        },
        "spacing_mm": {"xs": 2, "sm": 4, "md": 8, "lg": 12, "xl": 16, "xxl": 24},
        "radius_mm": {"sm": 1.5, "md": 2, "lg": 3},
        "grid": {
            "gutter_mm": {"A4": 6, "A5": 5},
            "col_gap_mm": {"A4": 8, "A5": 6}
        },
        "table": {
            "row_min_h_mm": {"A4": 6.5, "A5": 6},
            "header_bg": "#F3F6FB",
            "stripe_bg": "#FAFBFD"
        },
        "page": {
            "margins_mm": {"A4": 15, "A5": 10}
        }
    }
}

# Template-specific table column configurations
TABLE_COLUMNS = {
    "GST_TABULAR_STANDARD_A4": [
        {"key": "sl", "label": "Sl", "class": ""},
        {"key": "desc", "label": "Description", "class": ""},
        {"key": "hsn", "label": "HSN/SAC", "class": ""},
        {"key": "qty", "label": "Qty", "class": "num"},
        {"key": "uqc", "label": "UQC", "class": ""},
        {"key": "rate", "label": "Rate", "class": "num"},
        {"key": "disc", "label": "Disc", "class": "num"},
        {"key": "taxable", "label": "Taxable", "class": "num"},
        {"key": "cgst_rate", "label": "CGST %", "class": "num"},
        {"key": "cgst_amt", "label": "CGST Amt", "class": "num"},
        {"key": "sgst_rate", "label": "SGST %", "class": "num"},
        {"key": "sgst_amt", "label": "SGST Amt", "class": "num"},
        {"key": "igst_rate", "label": "IGST %", "class": "num"},
        {"key": "igst_amt", "label": "IGST Amt", "class": "num"},
        {"key": "line_total", "label": "Total", "class": "num"}
    ],
    "GST_TABULAR_STANDARD_A5": [
        {"key": "sl", "label": "Sl", "class": ""},
        {"key": "desc", "label": "Item (HSN)", "class": ""},
        {"key": "qty", "label": "Qty", "class": "num"},
        {"key": "rate", "label": "Rate", "class": "num"},
        {"key": "taxable", "label": "Taxable", "class": "num"},
        {"key": "tax", "label": "Tax", "class": "num"},
        {"key": "line_total", "label": "Total", "class": "num"}
    ],
    "GST_SIMPLE_A5": [
        {"key": "sl", "label": "Sl", "class": ""},
        {"key": "desc", "label": "Description (HSN)", "class": ""},
        {"key": "qty_rate", "label": "Qty x Rate", "class": "num"},
        {"key": "taxable", "label": "Taxable", "class": "num"},
        {"key": "tax", "label": "Tax", "class": "num"},
        {"key": "total", "label": "Total", "class": "num"}
    ],
    "NONGST_TABULAR_A4A5": [
        {"key": "sl", "label": "Sl", "class": ""},
        {"key": "desc", "label": "Description", "class": ""},
        {"key": "qty", "label": "Qty", "class": "num"},
        {"key": "unit", "label": "Unit", "class": ""},
        {"key": "rate", "label": "Rate", "class": "num"},
        {"key": "disc", "label": "Discount", "class": "num"},
        {"key": "line_amount", "label": "Amount", "class": "num"}
    ]
}

def get_design_tokens():
    """Get PDF design tokens"""
    return PDF_DESIGN_TOKENS

def get_table_columns(template_id: str):
    """Get table columns configuration for a specific template"""
    return TABLE_COLUMNS.get(template_id, TABLE_COLUMNS["GST_TABULAR_STANDARD_A4"])

def get_font_size(paper_size: str, element: str = "base"):
    """Get font size for specific paper size and element"""
    tokens = PDF_DESIGN_TOKENS["tokens"]
    if element == "base":
        return tokens["font"]["base_pt"][paper_size]
    elif element == "h6":
        return tokens["font"]["h6_pt"][paper_size]
    elif element == "h5":
        return tokens["font"]["h5_pt"][paper_size]
    return tokens["font"]["base_pt"][paper_size]

def get_spacing(size: str):
    """Get spacing value in mm"""
    return PDF_DESIGN_TOKENS["tokens"]["spacing_mm"][size]

def get_page_margins(paper_size: str):
    """Get page margins for specific paper size"""
    return PDF_DESIGN_TOKENS["tokens"]["page"]["margins_mm"][paper_size]
