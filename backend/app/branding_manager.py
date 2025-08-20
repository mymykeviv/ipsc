"""
Branding Manager for Multi-Tenant Architecture
Handles tenant-specific branding, customization, and branded output generation
"""

import asyncio
import logging
import json
import base64
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from pathlib import Path
import os
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import qrcode
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from .tenant_config import tenant_config_manager
from .security_manager import security_manager

logger = logging.getLogger(__name__)


class BrandingManager:
    """Comprehensive branding management for multi-tenant architecture"""
    
    def __init__(self):
        self.branding_cache: Dict[str, Dict] = {}
        self.template_cache: Dict[str, Dict] = {}
        self._lock = asyncio.Lock()
        
        # Default branding templates
        self.default_branding = {
            'company_name': 'Default Company',
            'primary_color': '#2E86AB',
            'secondary_color': '#A23B72',
            'accent_color': '#F18F01',
            'logo_url': None,
            'logo_data': None,
            'font_family': 'Helvetica',
            'font_size': 12,
            'header_style': 'modern',
            'footer_text': 'Thank you for your business',
            'watermark': False,
            'custom_css': None
        }
    
    async def get_tenant_branding(self, tenant_id: str) -> Dict[str, Any]:
        """Get complete branding configuration for a tenant"""
        try:
            # Check cache first
            if tenant_id in self.branding_cache:
                return self.branding_cache[tenant_id]
            
            # Get tenant configuration
            config = await tenant_config_manager.get_tenant_config(tenant_id)
            if not config:
                logger.warning(f"Tenant configuration not found for {tenant_id}")
                return self.default_branding.copy()
            
            # Build branding configuration
            branding = self.default_branding.copy()
            branding.update(config.branding)
            
            # Add domain-specific branding
            branding = await self._apply_domain_branding(branding, config.domain)
            
            # Load logo if specified
            if branding.get('logo_url'):
                branding['logo_data'] = await self._load_logo(branding['logo_url'])
            
            # Cache the branding
            self.branding_cache[tenant_id] = branding
            
            return branding
            
        except Exception as e:
            logger.error(f"Failed to get branding for tenant {tenant_id}: {e}")
            return self.default_branding.copy()
    
    async def _apply_domain_branding(self, branding: Dict, domain: str) -> Dict:
        """Apply domain-specific branding defaults"""
        try:
            if domain == 'dental':
                # Dental clinic branding
                branding.update({
                    'primary_color': '#2E86AB',  # Professional blue
                    'secondary_color': '#A23B72',  # Medical purple
                    'accent_color': '#F18F01',    # Warm orange
                    'font_family': 'Arial',
                    'header_style': 'medical',
                    'footer_text': 'Your trusted dental care partner',
                    'custom_css': self._get_dental_css()
                })
            elif domain == 'manufacturing':
                # Manufacturing branding
                branding.update({
                    'primary_color': '#1B4332',  # Industrial green
                    'secondary_color': '#2D3748',  # Dark gray
                    'accent_color': '#E53E3E',    # Industrial red
                    'font_family': 'Roboto',
                    'header_style': 'industrial',
                    'footer_text': 'Quality manufacturing solutions',
                    'custom_css': self._get_manufacturing_css()
                })
            
            return branding
            
        except Exception as e:
            logger.error(f"Failed to apply domain branding for {domain}: {e}")
            return branding
    
    def _get_dental_css(self) -> str:
        """Get dental-specific CSS styles"""
        return """
        .dental-header {
            background: linear-gradient(135deg, #2E86AB 0%, #A23B72 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .dental-logo {
            max-width: 200px;
            height: auto;
        }
        .dental-primary {
            color: #2E86AB;
        }
        .dental-secondary {
            color: #A23B72;
        }
        """
    
    def _get_manufacturing_css(self) -> str:
        """Get manufacturing-specific CSS styles"""
        return """
        .manufacturing-header {
            background: linear-gradient(135deg, #1B4332 0%, #2D3748 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .manufacturing-logo {
            max-width: 200px;
            height: auto;
        }
        .manufacturing-primary {
            color: #1B4332;
        }
        .manufacturing-secondary {
            color: #2D3748;
        }
        """
    
    async def _load_logo(self, logo_url: str) -> Optional[str]:
        """Load and encode logo image"""
        try:
            # This would typically load from a file system or CDN
            # For now, we'll return a placeholder
            if logo_url.startswith('http'):
                # External URL - would need to download
                return None
            else:
                # Local file path
                logo_path = Path(logo_url)
                if logo_path.exists():
                    with open(logo_path, 'rb') as f:
                        logo_data = f.read()
                        return base64.b64encode(logo_data).decode('utf-8')
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to load logo from {logo_url}: {e}")
            return None
    
    async def generate_branded_invoice(self, tenant_id: str, invoice_data: Dict) -> bytes:
        """Generate branded invoice PDF"""
        try:
            branding = await self.get_tenant_branding(tenant_id)
            
            # Create PDF buffer
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            story = []
            
            # Get styles
            styles = getSampleStyleSheet()
            
            # Create custom styles based on branding
            custom_style = ParagraphStyle(
                'CustomStyle',
                parent=styles['Normal'],
                fontName=branding['font_family'],
                fontSize=branding['font_size'],
                textColor=colors.HexColor(branding['primary_color'])
            )
            
            # Add header with branding
            header_data = [
                [branding['company_name'], ''],
                ['', ''],
                ['Invoice #' + str(invoice_data.get('invoice_number', '')), ''],
                ['Date: ' + str(invoice_data.get('date', '')), '']
            ]
            
            header_table = Table(header_data, colWidths=[4*inch, 2*inch])
            header_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, 0), colors.HexColor(branding['primary_color'])),
                ('TEXTCOLOR', (0, 0), (0, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), branding['font_family']),
                ('FONTSIZE', (0, 0), (-1, -1), branding['font_size']),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ]))
            
            story.append(header_table)
            story.append(Spacer(1, 20))
            
            # Add customer information
            customer_info = [
                ['Bill To:', ''],
                [invoice_data.get('customer_name', ''), ''],
                [invoice_data.get('customer_address', ''), ''],
                [invoice_data.get('customer_phone', ''), '']
            ]
            
            customer_table = Table(customer_info, colWidths=[4*inch, 2*inch])
            customer_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), branding['font_family']),
                ('FONTSIZE', (0, 0), (-1, -1), branding['font_size']),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            story.append(customer_table)
            story.append(Spacer(1, 20))
            
            # Add invoice items
            items_data = [['Item', 'Quantity', 'Price', 'Total']]
            for item in invoice_data.get('items', []):
                items_data.append([
                    item.get('description', ''),
                    str(item.get('quantity', 0)),
                    f"${item.get('price', 0):.2f}",
                    f"${item.get('total', 0):.2f}"
                ])
            
            items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1*inch, 1*inch])
            items_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(branding['secondary_color'])),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), branding['font_family']),
                ('FONTSIZE', (0, 0), (-1, -1), branding['font_size']),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            story.append(items_table)
            story.append(Spacer(1, 20))
            
            # Add totals
            total_data = [
                ['Subtotal:', f"${invoice_data.get('subtotal', 0):.2f}"],
                ['Tax:', f"${invoice_data.get('tax', 0):.2f}"],
                ['Total:', f"${invoice_data.get('total', 0):.2f}"]
            ]
            
            total_table = Table(total_data, colWidths=[4*inch, 2*inch])
            total_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, -1), branding['font_family']),
                ('FONTSIZE', (0, 0), (-1, -1), branding['font_size']),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            story.append(total_table)
            story.append(Spacer(1, 20))
            
            # Add footer
            footer = Paragraph(branding['footer_text'], custom_style)
            story.append(footer)
            
            # Build PDF
            doc.build(story)
            pdf_data = buffer.getvalue()
            buffer.close()
            
            return pdf_data
            
        except Exception as e:
            logger.error(f"Failed to generate branded invoice for tenant {tenant_id}: {e}")
            raise
    
    async def generate_branded_report(self, tenant_id: str, report_data: Dict, report_type: str) -> bytes:
        """Generate branded report PDF"""
        try:
            branding = await self.get_tenant_branding(tenant_id)
            
            # Create PDF buffer
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            story = []
            
            # Get styles
            styles = getSampleStyleSheet()
            
            # Create custom styles
            title_style = ParagraphStyle(
                'TitleStyle',
                parent=styles['Title'],
                fontName=branding['font_family'],
                fontSize=18,
                textColor=colors.HexColor(branding['primary_color'])
            )
            
            # Add header
            title = Paragraph(f"{report_type.title()} Report", title_style)
            story.append(title)
            story.append(Spacer(1, 20))
            
            # Add company information
            company_info = [
                [branding['company_name'], ''],
                ['Report Date:', datetime.now().strftime('%Y-%m-%d')],
                ['Generated By:', report_data.get('generated_by', 'System')]
            ]
            
            company_table = Table(company_info, colWidths=[4*inch, 2*inch])
            company_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), branding['font_family']),
                ('FONTSIZE', (0, 0), (-1, -1), branding['font_size']),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            story.append(company_table)
            story.append(Spacer(1, 20))
            
            # Add report content based on type
            if report_type == 'financial':
                story.extend(await self._generate_financial_report_content(report_data, branding))
            elif report_type == 'inventory':
                story.extend(await self._generate_inventory_report_content(report_data, branding))
            elif report_type == 'sales':
                story.extend(await self._generate_sales_report_content(report_data, branding))
            
            # Add footer
            footer_style = ParagraphStyle(
                'FooterStyle',
                parent=styles['Normal'],
                fontName=branding['font_family'],
                fontSize=10,
                textColor=colors.HexColor(branding['secondary_color'])
            )
            
            footer = Paragraph(branding['footer_text'], footer_style)
            story.append(Spacer(1, 20))
            story.append(footer)
            
            # Build PDF
            doc.build(story)
            pdf_data = buffer.getvalue()
            buffer.close()
            
            return pdf_data
            
        except Exception as e:
            logger.error(f"Failed to generate branded report for tenant {tenant_id}: {e}")
            raise
    
    async def _generate_financial_report_content(self, report_data: Dict, branding: Dict) -> List:
        """Generate financial report content"""
        content = []
        
        # Add summary
        summary_data = [
            ['Total Revenue:', f"${report_data.get('total_revenue', 0):.2f}"],
            ['Total Expenses:', f"${report_data.get('total_expenses', 0):.2f}"],
            ['Net Profit:', f"${report_data.get('net_profit', 0):.2f}"],
            ['Profit Margin:', f"{report_data.get('profit_margin', 0):.1f}%"]
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 3*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(branding['primary_color'])),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), branding['font_family']),
            ('FONTSIZE', (0, 0), (-1, -1), branding['font_size']),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        content.append(summary_table)
        content.append(Spacer(1, 20))
        
        return content
    
    async def _generate_inventory_report_content(self, report_data: Dict, branding: Dict) -> List:
        """Generate inventory report content"""
        content = []
        
        # Add inventory summary
        inventory_data = [['Product', 'Quantity', 'Value']]
        for item in report_data.get('inventory_items', []):
            inventory_data.append([
                item.get('product_name', ''),
                str(item.get('quantity', 0)),
                f"${item.get('value', 0):.2f}"
            ])
        
        inventory_table = Table(inventory_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
        inventory_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(branding['secondary_color'])),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), branding['font_family']),
            ('FONTSIZE', (0, 0), (-1, -1), branding['font_size']),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        content.append(inventory_table)
        content.append(Spacer(1, 20))
        
        return content
    
    async def _generate_sales_report_content(self, report_data: Dict, branding: Dict) -> List:
        """Generate sales report content"""
        content = []
        
        # Add sales summary
        sales_data = [['Period', 'Sales', 'Orders', 'Average Order']]
        for period in report_data.get('sales_periods', []):
            sales_data.append([
                period.get('period', ''),
                f"${period.get('sales', 0):.2f}",
                str(period.get('orders', 0)),
                f"${period.get('average_order', 0):.2f}"
            ])
        
        sales_table = Table(sales_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1*inch])
        sales_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(branding['accent_color'])),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), branding['font_family']),
            ('FONTSIZE', (0, 0), (-1, -1), branding['font_size']),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        content.append(sales_table)
        content.append(Spacer(1, 20))
        
        return content
    
    async def generate_qr_code(self, tenant_id: str, data: str) -> str:
        """Generate QR code with tenant branding"""
        try:
            branding = await self.get_tenant_branding(tenant_id)
            
            # Create QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(data)
            qr.make(fit=True)
            
            # Create QR code image
            qr_image = qr.make_image(fill_color=branding['primary_color'], back_color="white")
            
            # Convert to base64
            buffer = BytesIO()
            qr_image.save(buffer, format='PNG')
            qr_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            buffer.close()
            
            return qr_data
            
        except Exception as e:
            logger.error(f"Failed to generate QR code for tenant {tenant_id}: {e}")
            raise
    
    async def get_ui_branding(self, tenant_id: str) -> Dict[str, Any]:
        """Get UI branding configuration for frontend"""
        try:
            branding = await self.get_tenant_branding(tenant_id)
            
            ui_branding = {
                'colors': {
                    'primary': branding['primary_color'],
                    'secondary': branding['secondary_color'],
                    'accent': branding['accent_color']
                },
                'typography': {
                    'fontFamily': branding['font_family'],
                    'fontSize': branding['font_size']
                },
                'logo': {
                    'url': branding.get('logo_url'),
                    'data': branding.get('logo_data')
                },
                'header': {
                    'style': branding['header_style'],
                    'title': branding['company_name']
                },
                'footer': {
                    'text': branding['footer_text']
                },
                'customCSS': branding.get('custom_css')
            }
            
            return ui_branding
            
        except Exception as e:
            logger.error(f"Failed to get UI branding for tenant {tenant_id}: {e}")
            return {}
    
    async def update_tenant_branding(self, tenant_id: str, branding_updates: Dict) -> bool:
        """Update tenant branding configuration"""
        try:
            # Get current branding
            current_branding = await self.get_tenant_branding(tenant_id)
            
            # Update branding
            current_branding.update(branding_updates)
            
            # Update tenant configuration
            await tenant_config_manager.update_tenant(tenant_id, {
                'branding': current_branding
            })
            
            # Clear cache
            if tenant_id in self.branding_cache:
                del self.branding_cache[tenant_id]
            
            # Log branding update
            await security_manager.log_security_event(
                'BRANDING_UPDATED', tenant_id, None,
                {'updates': list(branding_updates.keys())}, 'INFO'
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update branding for tenant {tenant_id}: {e}")
            return False
    
    async def clear_branding_cache(self, tenant_id: Optional[str] = None):
        """Clear branding cache"""
        try:
            if tenant_id:
                if tenant_id in self.branding_cache:
                    del self.branding_cache[tenant_id]
            else:
                self.branding_cache.clear()
            
            logger.info(f"Cleared branding cache for {tenant_id or 'all tenants'}")
            
        except Exception as e:
            logger.error(f"Failed to clear branding cache: {e}")


# Global branding manager instance
branding_manager = BrandingManager()
