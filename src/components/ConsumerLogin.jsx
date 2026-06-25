import React, { useState, useEffect } from 'react';
import { 
  getTOTPSecret, 
  verifyTOTP, 
  getEmployee, 
  createSession,
  recordLoginAttempt,
  checkAccountLockout,
  checkFailedAttempts,
  registerTrustedDevice,
  verifyTrustedDevice,
  useBackupCode,
  generateBackupCodes
} from '../services/authService';
import TOTPSetup from './TOTPSetup';
import './Login.css';

export default function ConsumerLogin({ onLoginSuccess }) {
  const [step, setStep] = useState('employee-id'); // 'employee-id', 'trusted-device', 'totp-setup', 'totp-verify', 'backup-code'
  const [employeeId, setEmployeeId] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [totpSecret, setTotpSecret] = useState(null);

  // Check for trusted device on mount
  useEffect(() => {
    const checkTrustedDevice = async () => {
      const savedEmployeeId = localStorage.getItem('last_employee_id');
      if (savedEmployeeId) {
        try {
          const device = await verifyTrustedDevice(savedEmployeeId, 'employee');
          if (device) {
            setEmployeeId(savedEmployeeId);
            setStep('trusted-device');
          }
        } catch (err) {
          console.log('Device verification failed:', err);
        }
      }
    };
    
    checkTrustedDevice();
  }, []);

  const handleTrustedDeviceLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Auto-login with trusted device
      await recordLoginAttempt(employeeId, 'employee', true);
      createSession(employeeId, false);
      setMessage('Login successful!');
      
      setTimeout(() => onLoginSuccess(), 500);
    } catch (err) {
      setError(err.message || 'Error. Please try again.');
      setStep('employee-id');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEmployeeId = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Normalize ID for lookup
      const normalizedId = employeeId.trim();
      const lowercaseId = normalizedId.toLowerCase();
      const uppercaseId = normalizedId.toUpperCase();

      // Check if account is locked (try both cases)
      let lockout = await checkAccountLockout(lowercaseId, 'employee');
      if (!lockout) {
        lockout = await checkAccountLockout(uppercaseId, 'employee');
      }
      if (lockout) {
        const lockoutTime = new Date(lockout.locked_until);
        const minutesLeft = Math.ceil((lockoutTime - new Date()) / 60000);
        throw new Error(`Account locked. Try again in ${minutesLeft} minutes.`);
      }

      // Check failed attempts (try both cases)
      try {
        await checkFailedAttempts(lowercaseId, 'employee');
      } catch (err) {
        if (err.message.includes('locked')) throw err;
      }

      // Try to find as employee first (uppercase for employees)
      let user = await getEmployee(uppercaseId);
      let userType = 'employee';
      let lookupId = uppercaseId;
      
      // If not found as employee, try as admin (lowercase for admins)
      if (!user) {
        const { getAdmin, isAdmin: checkIsAdmin } = await import('../services/authService');
        const isAdminUser = await checkIsAdmin(lowercaseId);
        if (isAdminUser) {
          user = await getAdmin(lowercaseId);
          userType = 'admin';
          lookupId = lowercaseId;
        }
      }

      if (!user) {
        await recordLoginAttempt(lowercaseId, 'employee', false);
        throw new Error('User ID not found');
      }

      if (user.status !== 'active') {
        throw new Error('This user account is inactive');
      }

      // Check if TOTP is already set up
      const secret = await getTOTPSecret(userType, lookupId);
      
      if (secret) {
        // TOTP already set up, ask for verification
        setTotpSecret(secret);
        setStep('totp-verify');
      } else {
        // TOTP not set up, show setup flow
        setTotpSecret(null);
        setStep('totp-setup');
      }
      
      // Store the normalized lookup ID for later use
      localStorage.setItem('last_employee_id', lookupId);
      localStorage.setItem('user_type', userType);
      // Also update state to use the correct lookup ID
      setEmployeeId(lookupId);
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
      const codes = await generateBackupCodes(employeeId, 'employee');
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
        await recordLoginAttempt(employeeId, 'employee', false);
        throw new Error('Invalid authenticator code. Please try again.');
      }

      // Get user type (admin or employee)
      const userType = localStorage.getItem('user_type') || 'employee';

      // Register trusted device if requested
      if (rememberDevice) {
        await registerTrustedDevice(employeeId, userType, `Mobile Device`);
        setMessage('Device remembered for 30 days');
      }

      // Successful login
      await recordLoginAttempt(employeeId, 'employee', true);
      createSession(employeeId, false);
      setMessage('Login successful!');
      
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

      // Get user type (admin or employee)
      const userType = localStorage.getItem('user_type') || 'employee';

      // Use backup code
      await useBackupCode(employeeId, userType, backupCode);
      
      // Register trusted device if requested
      if (rememberDevice) {
        await registerTrustedDevice(employeeId, userType, `Mobile Device`);
      }

      // Successful login
      await recordLoginAttempt(employeeId, 'employee', true);
      createSession(employeeId, false);
      setMessage('Login successful!');
      
      setTimeout(() => onLoginSuccess(), 500);
    } catch (err) {
      setError(err.message || 'Invalid backup code');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'trusted-device') {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>📍 Store Mapper</h1>
          <p>Welcome Back!</p>
          
          <form onSubmit={handleTrustedDeviceLogin}>
            <div className="form-group">
              <p style={{ marginBottom: '20px', color: '#666' }}>
                ✅ Trusted device detected for <strong>{employeeId}</strong>
              </p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '⏳ Logging in...' : '→ Continue'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('employee-id');
                setEmployeeId('');
                setError('');
              }}
              className="btn-secondary"
              disabled={loading}
            >
              Use Different Account
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'totp-setup') {
    return (
      <TOTPSetup
        userType="employee"
        userId={employeeId}
        onComplete={handleTOTPSetupComplete}
        onCancel={() => {
          setStep('employee-id');
          setEmployeeId('');
          setError('');
        }}
      />
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>📍 Store Mapper</h1>
        <p>Employee Login</p>

        {step === 'employee-id' ? (
          <form onSubmit={handleSubmitEmployeeId}>
            <div className="form-group">
              <label>Employee or Admin ID</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g., SELA.PA.IM206 or w.rodriguez"
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
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="remember-device"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="remember-device">Remember this device for 30 days</label>
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
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="remember-device-backup"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="remember-device-backup">Remember this device for 30 days</label>
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
      </div>
    </div>
  );
}
