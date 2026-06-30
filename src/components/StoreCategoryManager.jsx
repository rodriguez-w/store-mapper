import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './StoreCategoryManager.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * StoreCategoryManager Component
 * Admin section for managing store categories
 */
export default function StoreCategoryManager() {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [bulkData, setBulkData] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('store_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Category name is required');
      }

      if (editingId) {
        // Update existing category
        const { error: updateError } = await supabase
          .from('store_categories')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim(),
          })
          .eq('id', editingId);

        if (updateError) throw updateError;
        setSuccess('Category updated successfully');
      } else {
        // Create new category
        const { error: insertError } = await supabase
          .from('store_categories')
          .insert([
            {
              id: `cat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              name: formData.name.trim(),
              description: formData.description.trim(),
            },
          ]);

        if (insertError) throw insertError;
        setSuccess('Category created successfully');
      }

      // Reset form
      setFormData({ name: '', description: '' });
      setEditingId(null);

      // Refresh categories
      await fetchCategories();

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error saving category');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setEditingId(category.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('store_categories')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSuccess('Category deleted successfully');
      await fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error deleting category');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setEditingId(null);
  };

  // Handle bulk add paste data
  const handleBulkPaste = (e) => {
    setBulkData(e.target.value);
  };

  // Handle CSV upload
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target.result;
      setBulkData(csv);
    };
    reader.readAsText(file);
  };

  // Process and add bulk categories
  const handleBulkAdd = async () => {
    if (!bulkData.trim()) {
      setError('No data to add');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Parse bulk data - one category per line (name | description)
      const lines = bulkData.split('\n').filter(line => line.trim());
      const newCategories = lines.map(line => {
        const parts = line.split('|').map(p => p.trim());
        return {
          id: `cat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          name: parts[0] || '',
          description: parts[1] || '',
        };
      }).filter(cat => cat.name); // Only include if name is not empty

      if (newCategories.length === 0) {
        throw new Error('No valid categories found. Format: Category Name | Description');
      }

      // Insert categories
      const { error: insertError } = await supabase
        .from('store_categories')
        .insert(newCategories);

      if (insertError) throw insertError;

      setSuccess(`✅ Successfully added ${newCategories.length} categories!`);
      setBulkData('');
      setShowBulkAdd(false);
      await fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error adding categories');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Download categories as CSV
  const handleDownloadCSV = () => {
    if (categories.length === 0) {
      setError('No categories to download');
      return;
    }

    // Create CSV content
    const headers = ['name', 'description'];
    const csvContent = [
      headers.join(','),
      ...categories.map(cat => 
        `"${cat.name || ''}","${(cat.description || '').replace(/"/g, '""')}"`
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `store_categories_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccess('✅ Categories downloaded successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="category-manager">
      <h3>📋 Manage Store Categories</h3>

      {/* Download Button */}
      <div className="category-actions-header">
        <button 
          className="btn-download-csv"
          onClick={handleDownloadCSV}
          disabled={loading || categories.length === 0}
        >
          ⬇️ Download Categories CSV
        </button>
      </div>

      {/* Toggle Bulk Add */}
      <div className="bulk-add-toggle">
        <button 
          className="btn-toggle-bulk"
          onClick={() => setShowBulkAdd(!showBulkAdd)}
        >
          {showBulkAdd ? '✕ Cancel Bulk Add' : '➕ Add Multiple Categories'}
        </button>
      </div>

      {/* Bulk Add Section */}
      {showBulkAdd && (
        <div className="bulk-add-section">
          <h4>Add Multiple Categories</h4>
          <p className="format-hint">Format: Category Name | Description (one per line)</p>
          <textarea
            value={bulkData}
            onChange={handleBulkPaste}
            placeholder="Pharmacy | Medication and health products&#10;Restaurant | Food and beverages&#10;Supermarket | Groceries and essentials"
            rows="6"
            disabled={loading}
          />
          <div className="bulk-actions">
            <button
              className="btn-upload-csv"
              disabled={loading}
            >
              <label htmlFor="csv-upload-cat" style={{ cursor: 'pointer', margin: 0 }}>
                📁 Or upload CSV
              </label>
              <input
                id="csv-upload-cat"
                type="file"
                accept=".csv,.txt"
                onChange={handleCSVUpload}
                style={{ display: 'none' }}
                disabled={loading}
              />
            </button>
            <button
              className="btn-bulk-add"
              onClick={handleBulkAdd}
              disabled={loading || !bulkData.trim()}
            >
              {loading ? '⏳ Adding...' : '✓ Add Categories'}
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="category-form">
        <div className="form-group">
          <label>Category Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Pharmacy, Restaurant, Supermarket"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of this category"
            disabled={loading}
            rows="2"
          ></textarea>
        </div>

        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}

        <div className="form-actions">
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? '⏳ Saving...' : editingId ? '✓ Update Category' : '✓ Add Category'}
          </button>
          {editingId && (
            <button type="button" className="btn-cancel" onClick={handleCancel} disabled={loading}>
              ✕ Cancel
            </button>
          )}
        </div>
      </form>

      {/* Categories List */}
      <div className="categories-list">
        <h4>Existing Categories ({categories.length})</h4>
        {categories.length === 0 ? (
          <p className="no-categories">No categories yet. Create one to get started!</p>
        ) : (
          <ul>
            {categories.map(cat => (
              <li key={cat.id} className="category-item">
                <div className="category-info">
                  <h5>{cat.name}</h5>
                  {cat.description && <p>{cat.description}</p>}
                </div>
                <div className="category-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(cat)}
                    disabled={loading}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(cat.id)}
                    disabled={loading}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
