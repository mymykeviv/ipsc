import smtplib
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from .config import settings


def send_email(to: str, subject: str, body: str, pdf_attachment=None, filename=None):
    """
    Send email with optional PDF attachment
    
    Args:
        to: Recipient email address
        subject: Email subject
        body: Email body (can be HTML)
        pdf_attachment: PDF content as bytes (optional)
        filename: Name for the PDF attachment (optional)
    """
    if not settings.smtp_enabled:
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = settings.smtp_from
        msg['To'] = to
        msg['Subject'] = subject
        
        # Add text and HTML parts
        text_part = MIMEText(body, 'plain')
        html_part = MIMEText(body, 'html')
        msg.attach(text_part)
        msg.attach(html_part)
        
        # Add PDF attachment if provided
        if pdf_attachment and filename:
            pdf_attachment = MIMEApplication(pdf_attachment, _subtype='pdf')
            pdf_attachment.add_header('Content-Disposition', 'attachment', filename=filename)
            msg.attach(pdf_attachment)
        
        # Send email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as s:
            if settings.smtp_use_tls:
                s.starttls()
            if settings.smtp_user and settings.smtp_password:
                s.login(settings.smtp_user, settings.smtp_password)
            s.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
        return False


def create_invoice_email_template(invoice_no: str, customer_name: str, amount: float, due_date: str, company_name: str = "CASHFLOW"):
    """
    Create HTML email template for invoice delivery
    """
    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #2c3e50; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f8f9fa; }}
            .invoice-details {{ background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }}
            .amount {{ font-size: 24px; color: #e74c3c; font-weight: bold; }}
            .footer {{ text-align: center; padding: 20px; color: #7f8c8d; font-size: 12px; }}
            .button {{ display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{company_name}</h1>
                <p>Invoice Delivery</p>
            </div>
            
            <div class="content">
                <h2>Dear {customer_name},</h2>
                
                <p>Please find attached the invoice for your recent transaction.</p>
                
                <div class="invoice-details">
                    <h3>Invoice Details:</h3>
                    <p><strong>Invoice Number:</strong> {invoice_no}</p>
                    <p><strong>Amount Due:</strong> <span class="amount">₹{amount:,.2f}</span></p>
                    <p><strong>Due Date:</strong> {due_date}</p>
                </div>
                
                <p>The invoice is attached to this email in PDF format. Please review the details and process the payment by the due date.</p>
                
                <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
                
                <p>Thank you for your business!</p>
                
                <p>Best regards,<br>
                {company_name} Team</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message from {company_name}. Please do not reply to this email.</p>
                <p>If you need assistance, please contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Create plain text version
    text_template = f"""
    Dear {customer_name},

    Please find attached the invoice for your recent transaction.

    Invoice Details:
    - Invoice Number: {invoice_no}
    - Amount Due: ₹{amount:,.2f}
    - Due Date: {due_date}

    The invoice is attached to this email in PDF format. Please review the details and process the payment by the due date.

    If you have any questions about this invoice, please don't hesitate to contact us.

    Thank you for your business!

    Best regards,
    {company_name} Team

    ---
    This is an automated message from {company_name}. Please do not reply to this email.
    """
    
    return text_template, html_template


def create_purchase_email_template(purchase_no: str, vendor_name: str, amount: float, due_date: str, company_name: str = "CASHFLOW"):
    """
    Create HTML email template for purchase order delivery
    """
    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #27ae60; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f8f9fa; }}
            .purchase-details {{ background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }}
            .amount {{ font-size: 24px; color: #e74c3c; font-weight: bold; }}
            .footer {{ text-align: center; padding: 20px; color: #7f8c8d; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{company_name}</h1>
                <p>Purchase Order</p>
            </div>
            
            <div class="content">
                <h2>Dear {vendor_name},</h2>
                
                <p>Please find attached the purchase order for your reference.</p>
                
                <div class="purchase-details">
                    <h3>Purchase Order Details:</h3>
                    <p><strong>Purchase Order Number:</strong> {purchase_no}</p>
                    <p><strong>Total Amount:</strong> <span class="amount">₹{amount:,.2f}</span></p>
                    <p><strong>Due Date:</strong> {due_date}</p>
                </div>
                
                <p>The purchase order is attached to this email in PDF format. Please review the details and ensure timely delivery.</p>
                
                <p>If you have any questions about this purchase order, please don't hesitate to contact us.</p>
                
                <p>Thank you for your service!</p>
                
                <p>Best regards,<br>
                {company_name} Team</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message from {company_name}. Please do not reply to this email.</p>
                <p>If you need assistance, please contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Create plain text version
    text_template = f"""
    Dear {vendor_name},

    Please find attached the purchase order for your reference.

    Purchase Order Details:
    - Purchase Order Number: {purchase_no}
    - Total Amount: ₹{amount:,.2f}
    - Due Date: {due_date}

    The purchase order is attached to this email in PDF format. Please review the details and ensure timely delivery.

    If you have any questions about this purchase order, please don't hesitate to contact us.

    Thank you for your service!

    Best regards,
    {company_name} Team

    ---
    This is an automated message from {company_name}. Please do not reply to this email.
    """
    
    return text_template, html_template

