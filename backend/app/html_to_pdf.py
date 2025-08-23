"""
HTML to PDF Converter for GST Invoice Templates
Uses WeasyPrint to convert HTML to PDF
"""

import os
from typing import Optional
from io import BytesIO

try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False

try:
    import pdfkit
    PDFKIT_AVAILABLE = True
except ImportError:
    PDFKIT_AVAILABLE = False


class HTMLToPDFConverter:
    """HTML to PDF Converter using multiple backends"""
    
    def __init__(self):
        self.backend = self._get_available_backend()
    
    def _get_available_backend(self) -> str:
        """Get the best available PDF conversion backend"""
        if WEASYPRINT_AVAILABLE:
            return "weasyprint"
        elif PDFKIT_AVAILABLE:
            return "pdfkit"
        else:
            return "none"
    
    def convert_html_to_pdf(self, html_content: str, paper_size: str = "A4") -> Optional[bytes]:
        """Convert HTML content to PDF bytes"""
        
        if self.backend == "weasyprint":
            return self._convert_with_weasyprint(html_content, paper_size)
        elif self.backend == "pdfkit":
            return self._convert_with_pdfkit(html_content, paper_size)
        else:
            raise RuntimeError("No PDF conversion backend available. Install WeasyPrint or pdfkit.")
    
    def _convert_with_weasyprint(self, html_content: str, paper_size: str = "A4") -> bytes:
        """Convert HTML to PDF using WeasyPrint"""
        try:
            # Create HTML object
            html = HTML(string=html_content)
            
            # Define page size
            page_size = "A4" if paper_size == "A4" else "A5"
            
            # Convert to PDF
            pdf_bytes = html.write_pdf(
                stylesheets=[],
                optimize_size=('fonts', 'images'),
                presentational_hints=True
            )
            
            return pdf_bytes
            
        except Exception as e:
            raise RuntimeError(f"WeasyPrint conversion failed: {str(e)}")
    
    def _convert_with_pdfkit(self, html_content: str, paper_size: str = "A4") -> bytes:
        """Convert HTML to PDF using pdfkit (wkhtmltopdf)"""
        try:
            # Configure options
            options = {
                'page-size': paper_size,
                'margin-top': '0.75in',
                'margin-right': '0.75in',
                'margin-bottom': '0.75in',
                'margin-left': '0.75in',
                'encoding': "UTF-8",
                'no-outline': None,
                'enable-local-file-access': None
            }
            
            # Convert to PDF
            pdf_bytes = pdfkit.from_string(html_content, False, options=options)
            
            return pdf_bytes
            
        except Exception as e:
            raise RuntimeError(f"pdfkit conversion failed: {str(e)}")
    
    def get_backend_info(self) -> dict:
        """Get information about available backends"""
        return {
            "current_backend": self.backend,
            "weasyprint_available": WEASYPRINT_AVAILABLE,
            "pdfkit_available": PDFKIT_AVAILABLE,
            "backends_available": [b for b in ["weasyprint", "pdfkit"] if b in self.backend]
        }


def convert_html_to_pdf(html_content: str, paper_size: str = "A4") -> bytes:
    """Simple function to convert HTML to PDF"""
    converter = HTMLToPDFConverter()
    return converter.convert_html_to_pdf(html_content, paper_size)
