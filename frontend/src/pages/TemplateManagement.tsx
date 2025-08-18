import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EnhancedTemplatePreview from '../components/EnhancedTemplatePreview';

interface Template {
  id: number;
  name: string;
  description: string;
  html_content: string;
  css_content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplateFormData {
  name: string;
  description: string;
  html_content: string;
  css_content: string;
  is_default: boolean;
}

const TemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    html_content: '',
    css_content: '',
    is_default: false
  });
  const [showEnhancedPreview, setShowEnhancedPreview] = useState(false);

  const navigate = useNavigate();

  // Load templates
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/templates/');
      setTemplates(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Create template
  const handleCreateTemplate = async () => {
    try {
      const response = await axios.post('/api/templates/', formData);
      setTemplates([...templates, response.data]);
      setShowCreateModal(false);
      resetForm();
      setError(null);
    } catch (err) {
      setError('Failed to create template');
      console.error('Error creating template:', err);
    }
  };

  // Update template
  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      const response = await axios.put(`/api/templates/${selectedTemplate.id}`, formData);
      setTemplates(templates.map(t => t.id === selectedTemplate.id ? response.data : t));
      setShowEditModal(false);
      setSelectedTemplate(null);
      resetForm();
      setError(null);
    } catch (err) {
      setError('Failed to update template');
      console.error('Error updating template:', err);
    }
  };

  // Delete template
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      await axios.delete(`/api/templates/${selectedTemplate.id}`);
      setTemplates(templates.filter(t => t.id !== selectedTemplate.id));
      setShowDeleteModal(false);
      setSelectedTemplate(null);
      setError(null);
    } catch (err) {
      setError('Failed to delete template');
      console.error('Error deleting template:', err);
    }
  };

  // Set default template
  const handleSetDefault = async (templateId: number) => {
    try {
      await axios.patch(`/api/templates/${templateId}/set-default`);
      setTemplates(templates.map(t => ({
        ...t,
        is_default: t.id === templateId
      })));
      setError(null);
    } catch (err) {
      setError('Failed to set default template');
      console.error('Error setting default template:', err);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      html_content: '',
      css_content: '',
      is_default: false
    });
  };

  // Open edit modal
  const openEditModal = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      html_content: template.html_content,
      css_content: template.css_content,
      is_default: template.is_default
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (template: Template) => {
    setSelectedTemplate(template);
    setShowDeleteModal(true);
  };

  // Preview template
  const previewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowEnhancedPreview(true);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading templates...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        borderBottom: '1px solid #e0e0e0',
        paddingBottom: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333', fontSize: '28px' }}>Template Management</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Create and manage invoice templates
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          + Create Template
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {/* Templates Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '20px' 
      }}>
        {templates.map((template) => (
          <div key={template.id} style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {/* Template Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '15px'
            }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
                  {template.name}
                  {template.is_default && (
                    <span style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      marginLeft: '10px'
                    }}>
                      Default
                    </span>
                  )}
                </h3>
                <p style={{ 
                  margin: 0, 
                  color: '#666', 
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  {template.description}
                </p>
              </div>
            </div>

            {/* Template Actions */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              flexWrap: 'wrap',
              marginTop: '15px'
            }}>
              <button
                onClick={() => previewTemplate(template)}
                style={{
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Preview
              </button>
              <button
                onClick={() => openEditModal(template)}
                style={{
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Edit
              </button>
              {!template.is_default && (
                <button
                  onClick={() => handleSetDefault(template.id)}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Set Default
                </button>
              )}
              <button
                onClick={() => openDeleteModal(template)}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Delete
              </button>
            </div>

            {/* Template Info */}
            <div style={{ 
              marginTop: '15px', 
              paddingTop: '15px', 
              borderTop: '1px solid #f0f0f0',
              fontSize: '12px',
              color: '#666'
            }}>
              <div>Created: {new Date(template.created_at).toLocaleDateString()}</div>
              <div>Updated: {new Date(template.updated_at).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <TemplateModal
          title="Create Template"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateTemplate}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
        />
      )}

      {/* Edit Template Modal */}
      {showEditModal && selectedTemplate && (
        <TemplateModal
          title="Edit Template"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdateTemplate}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTemplate(null);
            resetForm();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTemplate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Delete Template</h3>
            <p style={{ margin: '0 0 20px 0', color: '#666' }}>
              Are you sure you want to delete "{selectedTemplate.name}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTemplate}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Preview Modal */}
      {showEnhancedPreview && selectedTemplate && (
        <EnhancedTemplatePreview
          template={selectedTemplate}
          isOpen={showEnhancedPreview}
          onClose={() => setShowEnhancedPreview(false)}
        />
      )}
    </div>
  );
};

// Template Modal Component
interface TemplateModalProps {
  title: string;
  formData: TemplateFormData;
  setFormData: (data: TemplateFormData) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90%',
        overflow: 'auto'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>{title}</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Template Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="Enter template name"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minHeight: '80px',
              resize: 'vertical'
            }}
            placeholder="Enter template description"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            HTML Content *
          </label>
          <textarea
            value={formData.html_content}
            onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minHeight: '200px',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
            placeholder="Enter HTML content"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            CSS Content
          </label>
          <textarea
            value={formData.css_content}
            onChange={(e) => setFormData({ ...formData, css_content: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minHeight: '150px',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
            placeholder="Enter CSS content"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            Set as default template
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!formData.name || !formData.html_content}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: formData.name && formData.html_content ? 'pointer' : 'not-allowed',
              opacity: formData.name && formData.html_content ? 1 : 0.6
            }}
          >
            {title.includes('Create') ? 'Create' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateManagement;
