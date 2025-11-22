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
          console.log('AuthContext Debug: User verified:', response.data.user);
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
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

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { user } = response.data;
      
      console.log('AuthContext Debug: Login response user:', user);
      setUser(user);
      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
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
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;