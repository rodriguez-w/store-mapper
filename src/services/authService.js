import { createClient } from '@supabase/supabase-js';
import { TOTP } from 'otpauth';
import QRCode from 'qrcode';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Authentication Service
 * Handles TOTP (Google Authenticator) and OTP generation, validation, and session management
 */

// ============ TOTP (Google Authenticator) Functions ============

// Generate TOTP secret for user
export const generateTOTPSecret = (userIdentifier) => {
  const totp = new TOTP({
    issuer: 'Store Mapper',
    label: userIdentifier,
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  });
  
  const secret = totp.secret.base32;
  const otpauthUrl = totp.toString();
  
  return {
    secret: secret,
    base32: secret,
    otpauth_url: otpauthUrl
  };
};

// Generate QR code for scanning
export const generateQRCode = async (secret) => {
  try {
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Verify TOTP token
export const verifyTOTP = (token, secret) => {
  try {
    // Create TOTP instance for verification
    const totp = new TOTP({
      secret: secret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    });
    
    // Check if token is valid (allow ±1 time window for clock skew)
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch (error) {
    console.error('Error verifying TOTP:', error);
    return false;
  }
};

// Save TOTP secret to database
export const saveTOTPSecret = async (userType, userId, secret) => {
  try {
    const table = userType === 'admin' ? 'admins' : 'employees';
    const { error } = await supabase
      .from(table)
      .update({ totp_secret: secret })
      .eq(userType === 'admin' ? 'admin_id' : 'employee_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error saving TOTP secret:', error);
    throw error;
  }
};

// Get TOTP secret from database
export const getTOTPSecret = async (userType, userId) => {
  try {
    const table = userType === 'admin' ? 'admins' : 'employees';
    const idField = userType === 'admin' ? 'admin_id' : 'employee_id';
    
    const { data, error } = await supabase
      .from(table)
      .select('totp_secret')
      .eq(idField, userId)
      .single();

    if (error) throw error;
    return data?.totp_secret || null;
  } catch (error) {
    console.error('Error getting TOTP secret:', error);
    return null;
  }
};

// Generate 6-digit OTP (legacy)
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Supabase Edge Function (which calls Resend)
export const sendOTP = async (employeeId, email) => {
  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    const { error: dbError } = await supabase
      .from('otp_codes')
      .insert([
        {
          employee_id: employeeId,
          code: otp,
          expires_at: expiresAt.toISOString(),
        },
      ]);

    if (dbError) throw dbError;

    // For development: log OTP to console instead of sending email
    if (import.meta.env.DEV) {
      console.log('%c🔐 OTP CODE FOR TESTING:', 'color: green; font-size: 16px; font-weight: bold;');
      console.log(`%cEmail: ${email}`, 'color: blue; font-size: 14px;');
      console.log(`%cCode: ${otp}`, 'color: red; font-size: 18px; font-weight: bold;');
      console.log('%c(This is a development mode. In production, this will be sent via email)', 'color: gray; font-style: italic;');
      
      return { 
        success: true, 
        message: `OTP sent! Check browser console for code (development mode)`,
        otp: otp // Include for testing
      };
    }

    // For production: send email via Supabase Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      console.error('Edge Function Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      throw new Error(`Failed to send OTP: ${response.statusText}`);
    }

    console.log('OTP sent successfully via Edge Function');
    return { success: true, message: 'OTP sent to your email' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

// Validate OTP
export const validateOTP = async (employeeId, code) => {
  try {
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('code', code)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
      return { valid: false, message: 'Invalid or expired OTP' };
    }

    // Mark OTP as used
    const { error: updateError } = await supabase
      .from('otp_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', data[0].id);

    if (updateError) throw updateError;

    return { valid: true, message: 'OTP validated' };
  } catch (error) {
    console.error('Error validating OTP:', error);
    throw error;
  }
};

// Get employee by ID (for consumer app)
export const getEmployee = async (employeeId) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching employee:', error);
    return null;
  }
};

// Get admin by ID (for admin panel)
export const getAdmin = async (adminId) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('admin_id', adminId)
      .eq('status', 'active')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching admin:', error);
    return null;
  }
};

// Check if user is admin (for admin panel access)
export const isAdmin = async (adminId) => {
  try {
    const admin = await getAdmin(adminId);
    return !!admin;
  } catch (error) {
    return false;
  }
};

// Session Management
export const createSession = (employeeId, isAdmin = false) => {
  const sessionId = Math.random().toString(36).substring(2);
  const sessionData = {
    sessionId,
    employeeId,
    isAdmin,
    loginTime: new Date().toISOString(),
  };
  sessionStorage.setItem('store_mapper_session', JSON.stringify(sessionData));
  return sessionData;
};

export const getSession = () => {
  const session = sessionStorage.getItem('store_mapper_session');
  return session ? JSON.parse(session) : null;
};

export const destroySession = () => {
  sessionStorage.removeItem('store_mapper_session');
};

// ============ Security Functions ============

// Record login attempt
export const recordLoginAttempt = async (userId, userType, success, ipAddress = null) => {
  try {
    const { error } = await supabase
      .from('login_attempts')
      .insert([
        {
          user_id: userId,
          user_type: userType,
          ip_address: ipAddress,
          success: success
        }
      ]);

    if (error) throw error;
  } catch (error) {
    console.error('Error recording login attempt:', error);
  }
};

// Check if account is locked
export const checkAccountLockout = async (userId, userType) => {
  try {
    const { data, error } = await supabase
      .from('account_lockouts')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .gt('locked_until', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data; // Returns lockout info if exists, null otherwise
  } catch (error) {
    console.error('Error checking lockout:', error);
    return null;
  }
};

// Check if too many failed attempts
export const checkFailedAttempts = async (userId, userType) => {
  try {
    // Count failed attempts in last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('login_attempts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('success', false)
      .gte('attempt_time', fifteenMinutesAgo);

    if (error) throw error;
    
    const failedCount = data?.length || 0;

    // If 5 or more failed attempts, lock account
    if (failedCount >= 5) {
      await lockAccount(userId, userType, 'Too many failed login attempts');
      throw new Error('Account locked due to too many failed attempts. Try again in 30 minutes.');
    }

    return failedCount;
  } catch (error) {
    console.error('Error checking failed attempts:', error);
    throw error;
  }
};

// Lock account
export const lockAccount = async (userId, userType, reason = 'Security lockout') => {
  try {
    const lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const { error } = await supabase
      .from('account_lockouts')
      .insert([
        {
          user_id: userId,
          user_type: userType,
          locked_until: lockedUntil.toISOString(),
          reason: reason
        }
      ]);

    if (error) throw error;
  } catch (error) {
    console.error('Error locking account:', error);
    throw error;
  }
};

// Generate backup codes
export const generateBackupCodes = async (userId, userType) => {
  try {
    const codes = Array.from({ length: 5 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Insert into database
    const codesData = codes.map(code => ({
      user_id: userId,
      user_type: userType,
      code: code,
      used: false
    }));

    const { error } = await supabase
      .from('totp_backup_codes')
      .insert(codesData);

    if (error) throw error;
    return codes;
  } catch (error) {
    console.error('Error generating backup codes:', error);
    throw error;
  }
};

// Use backup code (for account recovery)
export const useBackupCode = async (userId, userType, code) => {
  try {
    const { data, error } = await supabase
      .from('totp_backup_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('code', code.toUpperCase())
      .eq('used', false)
      .single();

    if (error || !data) {
      throw new Error('Invalid backup code');
    }

    // Mark as used
    await supabase
      .from('totp_backup_codes')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', data.id);

    return true;
  } catch (error) {
    console.error('Error using backup code:', error);
    throw error;
  }
};

// Get user's backup codes (admin only, for setup)
export const getUserBackupCodes = async (userId, userType) => {
  try {
    const { data, error } = await supabase
      .from('totp_backup_codes')
      .select('code')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('used', false);

    if (error) throw error;
    return data.map(row => row.code);
  } catch (error) {
    console.error('Error fetching backup codes:', error);
    return [];
  }
};

// ============ Trusted Devices Functions ============

// Generate device token
export const generateDeviceToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Register trusted device
export const registerTrustedDevice = async (userId, userType, deviceName = null) => {
  try {
    const deviceToken = generateDeviceToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const { error } = await supabase
      .from('trusted_devices')
      .insert([
        {
          user_id: userId,
          user_type: userType,
          device_token: deviceToken,
          device_name: deviceName || `Device-${new Date().toLocaleDateString()}`,
          expires_at: expiresAt.toISOString(),
          ip_address: await getClientIP()
        }
      ]);

    if (error) throw error;
    
    // Store token in localStorage
    localStorage.setItem(`trusted_device_${userId}`, deviceToken);
    
    return deviceToken;
  } catch (error) {
    console.error('Error registering trusted device:', error);
    throw error;
  }
};

// Verify trusted device
export const verifyTrustedDevice = async (userId, userType) => {
  try {
    const deviceToken = localStorage.getItem(`trusted_device_${userId}`);
    
    if (!deviceToken) {
      return null;
    }

    const { data, error } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('device_token', deviceToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      // Update last used
      await supabase
        .from('trusted_devices')
        .update({ last_used: new Date().toISOString() })
        .eq('id', data.id);
      
      return data;
    }

    return null;
  } catch (error) {
    console.error('Error verifying trusted device:', error);
    return null;
  }
};

// Remove trusted device
export const removeTrustedDevice = async (userId) => {
  try {
    localStorage.removeItem(`trusted_device_${userId}`);
    
    const { error } = await supabase
      .from('trusted_devices')
      .delete()
      .eq('device_token', localStorage.getItem(`trusted_device_${userId}`));

    if (error) throw error;
  } catch (error) {
    console.error('Error removing trusted device:', error);
  }
};

// Get client IP (best effort)
const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      headers: { 'Accept': 'application/json' }
    });
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.log('Could not fetch IP address');
    return 'unknown';
  }
};

export const isLoggedIn = () => {
  return !!getSession();
};

// Log audit trail
export const logAuditTrail = async (
  employeeId,
  action,
  storeId = null,
  oldStatus = null,
  newStatus = null,
  details = null
) => {
  try {
    const { error } = await supabase.from('audit_log').insert([
      {
        employee_id: employeeId,
        action,
        store_id: storeId,
        old_status: oldStatus,
        new_status: newStatus,
        details,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;
  } catch (error) {
    console.error('Error logging audit trail:', error);
  }
};
