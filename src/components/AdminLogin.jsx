import React, { useState } from 'react';
import { 
  isAdmin, 
  createSession, 
  getAdmin, 
  getTOTPSecret, 
  verifyTOTP,
  recordLoginAttempt,
  checkAccountLockout,
  checkFailedAttempts,
  generateBackupCodes,
  useBackupCode
} from '../services/authService';
import TOTPSetup from './TOTPSetup';
import './Login.css';

export default function AdminLogin({ onLoginSuccess }) {
  const [step, setStep] = useState('admin-id'); // 'admin-id', 'totp-setup', 'totp-verify', 'backup-code'
  const [adminId, setAdminId] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [totpSecret, setTotpSecret] = useState(null);

  const handleSubmitAdminId = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Check if account is locked
      const lockout = await checkAccountLockout(adminId, 'admin');
      if (lockout) {
        const lockoutTime = new Date(lockout.locked_until);
        const minutesLeft = Math.ceil((lockoutTime - new Date()) / 60000);
        throw new Error(`Account locked. Try again in ${minutesLeft} minutes.`);
      }

      // Check failed attempts
      await checkFailedAttempts(adminId, 'admin');

      // Check if user is admin
      const adminAccess = await isAdmin(adminId);
      if (!adminAccess) {
        await recordLoginAttempt(adminId, 'admin', false);
        throw new Error('Admin access denied');
      }

      // Get admin details
      const admin = await getAdmin(adminId);
      if (!admin) {
        await recordLoginAttempt(adminId, 'admin', false);
        throw new Error('Admin not found');
      }

      // Check if TOTP is already set up
      const secret = await getTOTPSecret('admin', adminId);
      
      if (secret) {
        // TOTP already set up, ask for verification
        setTotpSecret(secret);
        setStep('totp-verify');
      } else {
        // TOTP not set up, show setup flow
        setTotpSecret(null);
        setStep('totp-setup');
      }
    } catch (err) {
      setError(err.message || 'Error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTOTPSetupComplete = async (setupData) => {
    try {
      setLoading(true);
      // Generate backup codes for new 2FA setup
      const codes = await generateBackupCodes(adminId, 'admin');
      setMessage(`2FA setup complete! Save these backup codes: ${codes.join(', ')}`);
      setTotpSecret(setupData.secret);
      setStep('totp-verify');
    } catch (err) {
      setError('Error saving backup codes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (!totpCode || totpCode.length !== 6) {
        throw new Error('Please enter a 6-digit code');
      }

      // Verify TOTP code
      const isValid = verifyTOTP(totpCode, totpSecret);
      if (!isValid) {
        await recordLoginAttempt(adminId, 'admin', false);
        throw new Error('Invalid authenticator code. Please try again.');
      }

      // Successful login
      await recordLoginAttempt(adminId, 'admin', true);
      
      // Create session (no remember device - expires on tab close)
      createSession(adminId, true);
      setMessage('Admin login successful!');
      
      // Callback to parent
      setTimeout(() => onLoginSuccess(), 500);
    } catch (err) {
      setError(err.message || 'Error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBackupCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (!backupCode || backupCode.length < 8) {
        throw new Error('Please enter a valid backup code');
      }

      // Use backup code
      await useBackupCode(adminId, 'admin', backupCode);
      
      // Successful login
      await recordLoginAttempt(adminId, 'admin', true);
      createSession(adminId, true);
      setMessage('Admin login successful!');
      
      setTimeout(() => onLoginSuccess(), 500);
    } catch (err) {
      setError(err.message || 'Invalid backup code');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'totp-setup') {
    return (
      <TOTPSetup
        userType="admin"
        userId={adminId}
        onComplete={handleTOTPSetupComplete}
        onCancel={() => {
          setStep('admin-id');
          setAdminId('');
          setError('');
        }}
      />
    );
  }

  return (
    <div className="login-container admin">
      <div className="login-box">
        <h1>🔐 Admin Panel</h1>
        <p>Staff Only</p>

        {step === 'admin-id' ? (
          <form onSubmit={handleSubmitAdminId}>
            <div className="form-group">
              <label>Admin ID</label>
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value.toLowerCase())}
                placeholder="e.g., w.rodriguez or sela.pa.admin001"
                autoFocus
                disabled={loading}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '⏳ Loading...' : '→ Next'}
            </button>
          </form>
        ) : step === 'totp-verify' ? (
          <form onSubmit={handleSubmitTOTP}>
            <div className="form-group">
              <label>Google Authenticator Code</label>
              <p className="email-hint">Enter the 6-digit code from your authenticator app</p>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                autoFocus
                disabled={loading}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '⏳ Verifying...' : '✅ Verify Code'}
            </button>
            <button
              type="button"
              onClick={() => setStep('backup-code')}
              className="btn-secondary"
              disabled={loading}
            >
              Use Backup Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitBackupCode}>
            <div className="form-group">
              <label>Backup Code</label>
              <p className="email-hint">Enter one of your backup codes (8 characters)</p>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                autoFocus
                disabled={loading}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '⏳ Verifying...' : '✅ Verify Backup Code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('totp-verify');
                setBackupCode('');
                setError('');
              }}
              className="btn-secondary"
              disabled={loading}
            >
              ← Back to Authenticator
            </button>
          </form>
        )}

        {error && <div className="message error">{error}</div>}
        {message && <div className="message success">{message}</div>}

        <p className="admin-note">
          ⚠️ Session expires when browser closes
        </p>
      </div>
    </div>
  );
}
