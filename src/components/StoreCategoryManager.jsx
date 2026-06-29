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

  return (
    <div className="category-manager">
      <h3>📋 Manage Store Categories</h3>

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
