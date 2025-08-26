"""
PDF CSS Stylesheet for GST Invoice Templates
Contains all CSS styles for consistent PDF rendering across all templates
"""

PDF_CSS = """
/* Page setup */
.pdf-page {
  background: #FFFFFF;
  color: #1B1F24;
  font-family: 'Inter','Noto Sans', Arial, sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.pdf-page.A4 { font-size: 10pt; padding: 15mm; }
.pdf-page.A5 { font-size: 9pt; padding: 10mm; }

/* Utilities */
.u-flex { display: flex; }
.u-col { flex: 1 1 0; }
.u-right { text-align: right; }
.u-center { text-align: center; }
.u-bold { font-weight: 600; }
.u-mt-xs { margin-top: 2mm; } 
.u-mt-sm { margin-top: 4mm; } 
.u-mt-md { margin-top: 8mm; } 
.u-mt-lg { margin-top: 12mm; }
.u-mb-xs { margin-bottom: 2mm; } 
.u-mb-sm { margin-bottom: 4mm; } 
.u-mb-md { margin-bottom: 8mm; } 
.u-mb-lg { margin-bottom: 12mm; }
.u-px-sm { padding-left: 4mm; padding-right: 4mm; }
.u-muted { color: #5B6675; }
.u-mono { font-family: 'JetBrains Mono','Fira Mono',monospace; }

/* Header */
.pdf-header {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 8mm;
  border-bottom: 1px solid #D9DEE5;
  padding-bottom: 6mm;
}
.pdf-brand {
  display: grid;
  grid-template-columns: 16mm 1fr;
  gap: 4mm;
  align-items: center;
}
.pdf-logo {
  width: 16mm; height: 16mm; object-fit: contain;
}
.pdf-supplier h1 {
  font-size: 12pt; margin: 0; font-weight: 700; color: #1B1F24;
}
.pdf-supplier .trade { font-size: 10pt; color: #5B6675; }
.pdf-supplier .addr { font-size: 9pt; color: #1B1F24; line-height: 1.25; margin-top: 1mm; }
.pdf-supplier .addr div { margin: 0; }
.pdf-supplier .gstin { font-size: 9pt; color: #1B1F24; }
.pdf-supplier .contact { font-size: 9pt; color: #1B1F24; margin-top: 2mm; }
.pdf-supplier .contact .line { margin: 0.5mm 0; }

.pdf-invmeta { text-align: right; }
.pdf-invmeta .title { font-size: 12pt; font-weight: 700; color: #1E40AF; margin: 0 0 3mm 0; }
.pdf-invmeta .row { margin-bottom: 1.5mm; }
.pdf-invmeta .key { color: #5B6675; margin-right: 2mm; }
.pdf-invmeta .val { font-weight: 600; }

/* E-Invoice block */
.pdf-einv {
  display: grid; grid-template-columns: 1.2fr 1fr 1fr 20mm;
  gap: 6mm;
  border: 1px solid #D9DEE5; border-radius: 2mm;
  padding: 4mm; margin-top: 6mm;
  background: #F7F9FC;
}
.pdf-einv .qr { width: 20mm; height: 20mm; background: #fff; border: 1px solid #EDEFF3; }

/* Parties */
.pdf-parties {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8mm;
  margin-top: 8mm;
}
.party-card {
  border: 1px solid #D9DEE5; border-radius: 2mm;
  padding: 4mm;
}
.party-card .title {
  font-weight: 700; margin: 0 0 2mm 0; color: #1B1F24; font-size: 10pt;
}
.party-card .line { margin: 1mm 0; }
.party-card .muted { color: #5B6675; }

/* Inline meta row */
.pdf-meta-inline {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm;
  margin-top: 6mm;
  font-size: 9pt;
}

/* Tables */
.pdf-table { width: 100%; border-collapse: collapse; margin-top: 8mm; font-size: inherit; }
.pdf-table th {
  background: #F3F6FB; color: #1B1F24;
  padding: 3.5mm; border: 1px solid #D9DEE5; font-weight: 600; text-align: left;
}
.pdf-table td {
  padding: 3mm; border: 1px solid #EDEFF3; vertical-align: top;
}
.pdf-table .num { text-align: right; }
.pdf-table.striped tbody tr:nth-child(odd) { background: #FAFBFD; }

/* Items density for A5 */
.A5 .pdf-table.items td, .A5 .pdf-table.items th { padding: 2.5mm; }

/* GST Summary Box */
.pdf-box.gst {
  border: 1px solid #D9DEE5; border-radius: 2mm; padding: 4mm; margin-top: 8mm; background: #FFFFFF;
}
.pdf-box.gst .box-title { font-weight: 700; margin: 0 0 3mm 0; color: #1B1F24; }
.pdf-box.gst .row { display: grid; grid-template-columns: 1.5fr 1fr; padding: 2mm 0; border-top: 1px dashed #EDEFF3; }
.pdf-box.gst .row:first-child { border-top: none; }
.pdf-box.gst .key { color: #5B6675; }
.pdf-box.gst .val { text-align: right; font-weight: 600; }

/* Totals */
.pdf-totals {
  margin-top: 8mm;
  margin-left: auto; width: 70%;
}
.pdf-totals .row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6mm;
  padding: 2.5mm 0; border-top: 1px solid #EDEFF3;
}
.pdf-totals .label { color: #5B6675; }
.pdf-totals .value { text-align: right; font-weight: 600; }
.pdf-totals .grand {
  background: #F7F9FC; border: 1px solid #D9DEE5; border-radius: 2mm; padding: 3mm 4mm;
}
.pdf-amount-words {
  margin-top: 6mm; padding: 4mm; border: 1px dashed #D9DEE5; border-radius: 2mm; font-weight: 600;
}

/* Bank, Notes, Declaration */
.pdf-bank, .pdf-notes, .pdf-declare {
  margin-top: 8mm; border: 1px solid #EDEFF3; border-radius: 2mm; padding: 4mm; background: #FFFFFF;
}
.pdf-section-title { font-weight: 700; color: #1B1F24; margin: 0 0 3mm 0; }

/* Signature */
.pdf-sign {
  margin-top: 10mm; display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; align-items: end;
}
.pdf-sign .sig-box {
  border: 1px dashed #D9DEE5; border-radius: 2mm; height: 28mm; position: relative; padding: 3mm;
}
.pdf-sign .sig-img { max-height: 20mm; max-width: 60mm; object-fit: contain; }
.pdf-sign .sig-label { position: absolute; bottom: 3mm; left: 3mm; font-size: 9pt; color: #5B6675; }
.pdf-sign .seal { justify-self: end; width: 24mm; height: 24mm; border: 1px solid #D9DEE5; border-radius: 50%; opacity: 0.6; }

/* Footer */
.pdf-footer {
  margin-top: 10mm; text-align: center; color: #5B6675; font-size: 9pt;
}

/* Page-break rules */
.page-break { page-break-before: always; }
.avoid-break { page-break-inside: avoid; }
thead { display: table-header-group; }
tfoot { display: table-footer-group; }

/* Responsive adjustments for A5 */
.A5 .pdf-header { gap: 6mm; }
.A5 .pdf-parties { gap: 6mm; }
.A5 .pdf-meta-inline { gap: 4mm; }
.A5 .pdf-totals { width: 80%; }
.A5 .pdf-sign { gap: 8mm; }
"""

def get_pdf_css():
    """Get the complete PDF CSS stylesheet"""
    return PDF_CSS

def get_css_for_template(template_id: str, paper_size: str = "A4"):
    """Get CSS with template-specific adjustments"""
    css = PDF_CSS
    
    # Add template-specific CSS adjustments
    if "A5" in template_id or paper_size == "A5":
        css += """
/* A5 specific adjustments */
.pdf-page.A5 { font-size: 9pt; padding: 10mm; }
.A5 .pdf-table.items td, .A5 .pdf-table.items th { padding: 2.5mm; }
.A5 .pdf-header { gap: 6mm; }
.A5 .pdf-parties { gap: 6mm; }
.A5 .pdf-meta-inline { gap: 4mm; }
.A5 .pdf-totals { width: 80%; }
.A5 .pdf-sign { gap: 8mm; }
"""
    
    return css
