import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Employee Importer Component
 * Allows bulk importing of employee data for OTP-based authentication
 * Format: country, employee_id, name, email, status
 */
export default function EmployeeImporter({ onSuccess }) {
  const [pastedData, setPastedData] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Parse pasted data (tab-separated)
  const handlePaste = (e) => {
    const text = e.target.value;
    setPastedData(text);

    if (!text.trim()) {
      setParsedData([]);
      setPreviewRows([]);
      return;
    }

    // Parse tab-separated values
    const rows = text.split('\n').filter(row => row.trim());
    const parsed = rows.map(row => {
      const cols = row.split('\t');
      return {
        country: cols[0]?.trim() || '',
        employee_id: cols[1]?.trim() || '',
        name: cols[2]?.trim() || '',
        email: cols[3]?.trim() || '',
        status: (cols[4]?.trim() || 'active').toLowerCase(),
      };
    });

    setParsedData(parsed);
    setPreviewRows(parsed.slice(0, 5)); // Show first 5 rows as preview
  };

  // Upload employees to Supabase
  const handleUpload = async () => {
    if (parsedData.length === 0) {
      setMessage('No data to upload');
      setMessageType('error');
      return;
    }

    // Validate data
    const invalid = parsedData.filter(
      emp => !emp.employee_id || !emp.email || !emp.name
    );
    if (invalid.length > 0) {
      setMessage(`${invalid.length} rows missing required fields (Employee ID, Email, Name)`);
      setMessageType('error');
      return;
    }

    // Check for duplicate employee IDs
    const duplicates = parsedData.filter(
      (emp, idx, arr) => arr.findIndex(e => e.employee_id === emp.employee_id) !== idx
    );
    if (duplicates.length > 0) {
      setMessage(`${duplicates.length} duplicate employee IDs found`);
      setMessageType('error');
      return;
    }

    setUploading(true);
    try {
      // Check for existing employee IDs
      const { data: existing } = await supabase
        .from('employees')
        .select('employee_id')
        .in('employee_id', parsedData.map(e => e.employee_id));

      if (existing && existing.length > 0) {
        const existingIds = existing.map(e => e.employee_id).join(', ');
        setMessage(`These employee IDs already exist: ${existingIds}`);
        setMessageType('error');
        setUploading(false);
        return;
      }

      // Insert employees
      const { error } = await supabase
        .from('employees')
        .insert(parsedData);

      if (error) throw error;

      setMessage(`✅ Successfully imported ${parsedData.length} employees!`);
      setMessageType('success');
      setPastedData('');
      setParsedData([]);
      setPreviewRows([]);

      if (onSuccess) onSuccess();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="employee-importer">
      <h2>Paste Employee Data</h2>
      <p>Copy from Excel and paste tab-separated rows below:</p>
      <p className="format-hint">
        Format: country &nbsp; employee_id &nbsp; name &nbsp; email &nbsp; status
      </p>

      <textarea
        value={pastedData}
        onChange={handlePaste}
        placeholder="PANAMA	sela.pa.im206	Ricardo Pautt Solis	ricardo.pautt@mail-cca.com	active"
        rows="8"
      />

      {previewRows.length > 0 && (
        <div className="preview">
          <h3>Preview ({parsedData.length} rows)</h3>
          <table>
            <thead>
              <tr>
                <th>Country</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.country}</td>
                  <td>{row.employee_id}</td>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {parsedData.length > 5 && <p>... and {parsedData.length - 5} more rows</p>}
        </div>
      )}

      {message && (
        <div className={`message ${messageType}`}>
          {message}
          <button onClick={() => setMessage('')}>✕</button>
        </div>
      )}

      {parsedData.length > 0 && (
        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? '⏳ Importing...' : `✅ Import ${parsedData.length} Employees`}
        </button>
      )}
    </div>
  );
}
