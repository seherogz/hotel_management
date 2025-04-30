import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

// Create the auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoLoginDisabled, setAutoLoginDisabled] = useState(false);

  // Check if auto login is disabled
  useEffect(() => {
    const checkAutoLoginStatus = async () => {
      try {
        const autoLoginDisabled = await AsyncStorage.getItem('autoLoginDisabled');
        setAutoLoginDisabled(autoLoginDisabled === 'true');
      } catch (error) {
        console.error('Error checking auto login status:', error);
      }
    };

    checkAutoLoginStatus();
  }, []);

  // Check if user is already logged in on app start
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        // If auto login is disabled, don't restore the session
        if (autoLoginDisabled) {
          console.log('Auto login is disabled, not restoring session');
          setLoading(false);
          return;
        }
        
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        const sessionExpiry = await AsyncStorage.getItem('sessionExpiry');
        
        const now = new Date().getTime();
        const isSessionValid = sessionExpiry && parseInt(sessionExpiry) > now;
        
        if (storedUser && storedToken && isSessionValid) {
          console.log('Found valid stored user session, restoring...');
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } else {
          // Clear any expired session data
          if (storedUser || storedToken) {
            console.log('Session expired or invalid, clearing storage');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('sessionExpiry');
          } else {
            console.log('No stored user session found');
          }
        }
      } catch (e) {
        console.error('Failed to load auth state from storage', e);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, [autoLoginDisabled]);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(email, password);
      
      // Validate response
      if (!response || !response.jwToken) {
        throw new Error('Invalid response from server');
      }
      
      // Save user and token data
      const userData = {
        email: email,
        id: response.id,
        userName: response.userName,
        roles: response.roles
      };
      
      setUser(userData);
      setToken(response.jwToken);
      
      // Set session expiry (24 hours from now)
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
      
      // Store in AsyncStorage for persistence
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('token', response.jwToken);
      await AsyncStorage.setItem('sessionExpiry', expiryTime.toString());
      
      // Enable auto login
      await AsyncStorage.setItem('autoLoginDisabled', 'false');
      setAutoLoginDisabled(false);
      
      return response;
    } catch (error) {
      setError(error.message || 'Authentication failed');
      console.error('Login error in context:', error.message);
      // Important: Re-throw the error so it can be caught in the login screen
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    console.log('Logout function called');
    try {
      setLoading(true);
      setError(null);
      
      // Clear all auth-related items from storage
      const keysToRemove = [
        'user', 
        'token', 
        'sessionExpiry'
      ];
      
      const keysToSet = {
        'autoLoginDisabled': 'true',
        'isLoggedOut': 'true'
      };
      
      // Clear storage
      console.log('Clearing auth storage...');
      
      // Remove keys
      const removePromises = keysToRemove.map(key => AsyncStorage.removeItem(key));
      
      // Set new values
      const setPromises = Object.entries(keysToSet).map(
        ([key, value]) => AsyncStorage.setItem(key, value)
      );
      
      // Execute all storage operations in parallel
      await Promise.all([...removePromises, ...setPromises]);
      
      // Clear state
      console.log('Resetting auth state...');
      setUser(null);
      setToken(null);
      setAutoLoginDisabled(true);
      
      console.log('Logout successful');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout: ' + error.message);
      throw error; // Re-throw to allow handling in UI
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;
  console.log('Auth state:', { isAuthenticated, loading, autoLoginDisabled });

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        isAuthenticated,
        autoLoginDisabled,
        setAutoLoginDisabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 