import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// Create the auth context
const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Effect to check if user is already logged in (on app load)
  useEffect(() => {
    const initAuth = () => {
      try {
        // Check if user is already logged in (from localStorage)
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (savedToken && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } catch (e) {
            // Invalid user JSON
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function - herhangi bir kullanıcı adı/şifre kombinasyonu ile giriş yapılabilir
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // Geliştirme aşamasında herhangi bir kullanıcı adı ve şifre ile giriş yapılabilir
      // Normalde burada gerçek bir API çağrısı olur
      
      // Kullanıcı bilgilerini oluştur
      const userData = { 
        name: username, 
        role: 'Admin',
        fullName: username
      };
      
      // Kullanıcıyı ayarla ve yerel depolamaya kaydet
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('token', 'dev-token-' + Date.now());
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { user: userData, token: 'dev-token' };
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 