import React, { useState, useEffect } from 'react';

interface Template {
  id: number;
  name: string;
  description: string;
  html_content: string;
  css_content: string;
  is_default: boolean;
}

interface EnhancedTemplatePreviewProps {
  template: Template;
  isOpen: boolean;
  onClose: () => void;
  sampleData?: any;
}

type PreviewMode = 'desktop' | 'tablet' | 'mobile' | 'print';

const EnhancedTemplatePreview: React.FC<EnhancedTemplatePreviewProps> = ({
  template,
  isOpen,
  onClose,
  sampleData
}) => {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sample invoice data for preview
  const defaultSampleData = {
    invoice_number: 'INV-2024-001',
    invoice_date: '2024-01-15',
    due_date: '2024-02-15',
    customer_name: 'Sample Customer',
    customer_email: 'customer@example.com',
    customer_phone: '+1234567890',
    customer_address: '123 Sample Street, Sample City, SC 12345',
    items: [
      {
        description: 'Sample Product 1',
        quantity: 2,
        unit_price: 100.00,
        tax_rate: 10.0,
        total: 220.00
      },
      {
        description: 'Sample Product 2',
        quantity: 1,
        unit_price: 50.00,
        tax_rate: 5.0,
        total: 52.50
      }
    ],
    subtotal: 250.00,
    total_tax: 22.50,
    total_amount: 272.50,
    notes: 'Thank you for your business!',
    company_name: 'Sample Company',
    company_address: '456 Business Ave, Business City, BC 67890',
    company_phone: '+0987654321',
    company_email: 'info@samplecompany.com'
  };

  const data = sampleData || defaultSampleData;

  // Get device dimensions based on preview mode
  const getDeviceDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: 375, height: 667 };
      case 'tablet':
        return { width: 768, height: 1024 };
      case 'print':
        return { width: 794, height: 1123 }; // A4 size
      default:
        return { width: 1200, height: 800 };
    }
  };

  // Process template content with sample data
  const processTemplateContent = () => {
    let processedHtml = template.html_content;
    let processedCss = template.css_content;

    // Replace placeholders with sample data
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      if (typeof value === 'string') {
        processedHtml = processedHtml.replace(new RegExp(placeholder, 'g'), value);
      } else if (typeof value === 'number') {
        processedHtml = processedHtml.replace(new RegExp(placeholder, 'g'), value.toString());
      } else if (Array.isArray(value)) {
        // Handle items array
        if (key === 'items') {
          const itemsHtml = value.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>$${item.unit_price.toFixed(2)}</td>
              <td>${item.tax_rate}%</td>
              <td>$${item.total.toFixed(2)}</td>
            </tr>
          `).join('');
          processedHtml = processedHtml.replace(new RegExp(placeholder, 'g'), itemsHtml);
        }
      }
    });

    return { processedHtml, processedCss };
  };

  // Calculate total pages (simple estimation)
  useEffect(() => {
    const { height } = getDeviceDimensions();
    const contentHeight = template.html_content.length * 0.1; // Rough estimation
    setTotalPages(Math.max(1, Math.ceil(contentHeight / height)));
  }, [template, previewMode]);

  if (!isOpen) return null;

  const { width, height } = getDeviceDimensions();
  const { processedHtml, processedCss } = processTemplateContent();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        width: '95%',
        height: '95%',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#333' }}>
              Template Preview: {template.name}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              {template.description}
            </p>
          </div>
          
          {/* Preview Controls */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Device Mode Selector */}
            <div style={{ display: 'flex', gap: '5px' }}>
              {(['desktop', 'tablet', 'mobile', 'print'] as PreviewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPreviewMode(mode)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${previewMode === mode ? '#007bff' : '#ddd'}`,
                    backgroundColor: previewMode === mode ? '#007bff' : 'white',
                    color: previewMode === mode ? 'white' : '#333',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textTransform: 'capitalize'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <button
                onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
                style={{
                  padding: '5px 10px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                -
              </button>
              <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                style={{
                  padding: '5px 10px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>

            {/* View Options */}
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                onClick={() => setShowGrid(!showGrid)}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${showGrid ? '#007bff' : '#ddd'}`,
                  backgroundColor: showGrid ? '#007bff' : 'white',
                  color: showGrid ? 'white' : '#333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Grid
              </button>
              <button
                onClick={() => setShowRulers(!showRulers)}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${showRulers ? '#007bff' : '#ddd'}`,
                  backgroundColor: showRulers ? '#007bff' : 'white',
                  color: showRulers ? 'white' : '#333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Rulers
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflow: 'auto',
          backgroundColor: '#f5f5f5',
          position: 'relative'
        }}>
          {/* Rulers */}
          {showRulers && (
            <>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '20px',
                backgroundColor: '#e9ecef',
                borderBottom: '1px solid #dee2e6',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                fontSize: '10px',
                color: '#6c757d'
              }}>
                {Array.from({ length: Math.ceil(width / 50) }, (_, i) => (
                  <div key={i} style={{ width: '50px', textAlign: 'center' }}>
                    {i * 50}
                  </div>
                ))}
              </div>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '20px',
                backgroundColor: '#e9ecef',
                borderRight: '1px solid #dee2e6',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 0',
                fontSize: '10px',
                color: '#6c757d'
              }}>
                {Array.from({ length: Math.ceil(height / 50) }, (_, i) => (
                  <div key={i} style={{ height: '50px', display: 'flex', alignItems: 'center' }}>
                    {i * 50}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Preview Container */}
          <div style={{
            margin: showRulers ? '20px 0 0 20px' : '0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            minHeight: '100%'
          }}>
            <div style={{
              width: `${width}px`,
              minHeight: `${height}px`,
              backgroundColor: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Grid Overlay */}
              {showGrid && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                  pointerEvents: 'none',
                  zIndex: 1
                }} />
              )}

              {/* Template Content */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  padding: previewMode === 'print' ? '40px' : '20px'
                }}
                dangerouslySetInnerHTML={{
                  __html: `
                    <style>
                      ${processedCss}
                      ${previewMode === 'print' ? `
                        @media print {
                          body { margin: 0; padding: 0; }
                          .page-break { page-break-before: always; }
                        }
                      ` : ''}
                    </style>
                    ${processedHtml}
                  `
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '15px 20px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          <div>
            <span>Device: {previewMode.toUpperCase()}</span>
            <span style={{ margin: '0 10px' }}>|</span>
            <span>Size: {width} × {height}px</span>
            <span style={{ margin: '0 10px' }}>|</span>
            <span>Zoom: {zoomLevel}%</span>
          </div>
          
          <div>
            {totalPages > 1 && (
              <>
                <span>Page {currentPage} of {totalPages}</span>
                <span style={{ margin: '0 10px' }}>|</span>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '2px 8px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    borderRadius: '2px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '10px'
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '2px 8px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    borderRadius: '2px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '10px',
                    marginLeft: '5px'
                  }}
                >
                  Next
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTemplatePreview;
