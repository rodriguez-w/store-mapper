import React, { useState, useEffect } from 'react';
import { generateTOTPSecret, generateQRCode, verifyTOTP, saveTOTPSecret } from '../services/authService';
import './TOTP.css';

export default function TOTPSetup({ userType, userId, email, onComplete, onCancel }) {
  const [step, setStep] = useState('generate'); // 'generate' -> 'verify'
  const [secret, setSecret] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateSetup();
  }, []);

  const generateSetup = async () => {
    try {
      setError('');
      const newSecret = generateTOTPSecret(userId);
      const qrCodeUrl = await generateQRCode(newSecret);
      
      setSecret(newSecret);
      setQrCode(qrCodeUrl);
    } catch (err) {
      setError('Failed to generate QR code');
      console.error(err);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      setError('');
      
      // Verify the code
      const isValid = verifyTOTP(verificationCode, secret.base32);
      
      if (!isValid) {
        setError('Invalid code. Please try again.');
        setLoading(false);
        return;
      }

      // Save to database
      await saveTOTPSecret(userType, userId, secret.base32);
      
      setLoading(false);
      onComplete({
        secret: secret.base32,
        backupCodes: generateBackupCodes()
      });
    } catch (err) {
      setError(err.message || 'Error setting up 2FA');
      setLoading(false);
    }
  };

  const generateBackupCodes = () => {
    // Generate 5 backup codes for emergency access
    return Array.from({ length: 5 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
  };

  if (step === 'generate') {
    return (
      <div className="totp-setup">
        <div className="totp-card">
          <h2>Set Up Google Authenticator</h2>
          
          <div className="totp-steps">
            <p className="step-number">Step 1 of 2</p>
            
            <ol>
              <li>Download <strong>Google Authenticator</strong> app (iOS/Android)</li>
              <li>Open the app and tap <strong>"+"</strong> to add account</li>
              <li>Tap <strong>"Scan QR Code"</strong> and scan this code:</li>
            </ol>

            {qrCode ? (
              <div className="qr-container">
                <img src={qrCode} alt="QR Code" className="qr-code" />
              </div>
            ) : (
              <div className="loading">Generating QR code...</div>
            )}

            <p className="manual-entry">
              <strong>Can't scan?</strong><br/>
              Enter this code manually in the app:
              <code>{secret?.base32 || '...'}</code>
            </p>

            {error && <div className="error-message">{error}</div>}

            <div className="totp-actions">
              <button 
                onClick={() => setStep('verify')}
                disabled={!secret}
                className="btn-primary"
              >
                I've Scanned the Code
              </button>
              <button 
                onClick={onCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="totp-setup">
      <div className="totp-card">
        <h2>Verify Google Authenticator</h2>
        
        <div className="totp-steps">
          <p className="step-number">Step 2 of 2</p>
          
          <p>Enter the 6-digit code from your Google Authenticator app:</p>
          
          <input
            type="text"
            maxLength="6"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
            className="totp-input"
            disabled={loading}
          />

          {error && <div className="error-message">{error}</div>}

          <div className="totp-actions">
            <button 
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              className="btn-primary"
            >
              {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
            </button>
            <button 
              onClick={() => setStep('generate')}
              className="btn-secondary"
              disabled={loading}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
