import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    // Check if user is logged in on initial load
    const checkAuthStatus = async () => {
      try {
        // Verify token with backend
        const response = await axios.get('/api/auth/verify');
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        // User is not authenticated
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    checkAuthStatus();

    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Login.
   * Returns one of:
   *   { success: true, user }                      — full session (non-admin, or already-mfa'd via cookie roundtrip)
   *   { success: false, requiresMfa: true, requiresEnrollment, mfaToken, user }
   *                                                — admin must complete the MFA challenge
   *   { success: false, error }                    — bad credentials
   */
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });

      if (response.data.requiresMfa) {
        return {
          success: false,
          requiresMfa: true,
          requiresEnrollment: !!response.data.requiresEnrollment,
          mfaToken: response.data.mfaToken,
          user: response.data.user,
        };
      }

      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  /**
   * Begin MFA enrollment. Returns the QR data URL, otpauth URL, and secret
   * (for manual entry). The backend has already stashed the secret on the
   * user row in mfa_secret (but mfa_enabled is still false) — the user
   * must prove they can produce a TOTP code from that secret.
   */
  const enrollMfaStart = async () => {
    try {
      const response = await axios.post('/api/auth/mfa/enroll-start');
      return { success: true, ...response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to start enrollment',
      };
    }
  };

  /**
   * Confirm MFA enrollment with a 6-digit code. Returns the recovery codes
   * (which the UI must show ONCE) and the final user object.
   */
  const enrollMfaVerify = async (code) => {
    try {
      const response = await axios.post('/api/auth/mfa/enroll-verify', { code });
      setUser(response.data.user);
      return { success: true, recoveryCodes: response.data.recoveryCodes, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Invalid code',
      };
    }
  };

  /**
   * Verify a TOTP code (or recovery code) for an already-enrolled admin.
   * The mfaToken is the one returned from login().
   */
  const verifyMfa = async (mfaToken, { code, recoveryCode }) => {
    try {
      const response = await axios.post(
        '/api/auth/mfa/verify',
        { code, recoveryCode },
        { headers: { 'X-MFA-Token': mfaToken } }
      );
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Invalid code',
      };
    }
  };

  const getMfaStatus = async () => {
    try {
      const response = await axios.get('/api/auth/mfa/status');
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    }
  };

  const regenerateRecoveryCodes = async (code) => {
    try {
      const response = await axios.post('/api/auth/mfa/recovery-codes', { code });
      return { success: true, recoveryCodes: response.data.recoveryCodes };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to regenerate recovery codes',
      };
    }
  };

  const disableMfa = async (password, code) => {
    try {
      const response = await axios.post('/api/auth/mfa/disable', { password, code });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to disable MFA',
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      // Logout error is non-fatal — we still clear local state.
    } finally {
      setUser(null);
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { user } = response.data;
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed',
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    enrollMfaStart,
    enrollMfaVerify,
    verifyMfa,
    getMfaStatus,
    regenerateRecoveryCodes,
    disableMfa,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
