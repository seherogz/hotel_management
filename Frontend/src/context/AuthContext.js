import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

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

  // Login function - API servisini kullanarak giriş yapar
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // authService'i kullanarak giriş yap
      const userData = await authService.login(username, password); // authService returns the user data directly
      
      // Kullanıcı bilgilerini ayarla (userData zaten kullanıcı objesi)
      setUser(userData); 
      setIsAuthenticated(true);
      // Kullanıcı bilgilerini localStorage'a kaydet (authService bunu zaten yapıyor ama burada da yapmak yedekli olmaz)
      // Make sure authService saves the correct structure
      localStorage.setItem('user', JSON.stringify(userData)); 
      localStorage.setItem('token', userData.jwToken); // Ensure token is also saved here or in authService
      localStorage.setItem('isAuthenticated', 'true'); // Ensure auth flag is set

      return userData; // Return the user data
    } catch (err) {
      setError(err.message || 'Giriş başarısız');
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