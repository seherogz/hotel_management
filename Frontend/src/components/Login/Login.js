import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Login.module.css';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { login, loading, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Add login-page class to body
  useEffect(() => {
    document.body.classList.add('login-page');
    
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!credentials.username || !credentials.password) {
      setError('Kullanıcı adı ve şifre gereklidir.');
      return;
    }
    
    setError('');
    
    // Konsola giriş bilgilerini yazdıralım (sadece geliştirme amaçlı)
    console.log('Giriş bilgileri:', credentials);
    
    try {
      // Use the auth context's login function
      await login(credentials.username, credentials.password);
      
      // Navigate to the redirect path after successful login
      navigate(from, { replace: true });
    } catch (err) {
      // Handle error (most errors will be handled by the auth context)
      if (err.response?.status === 401) {
        setError('Geçersiz kullanıcı adı veya şifre.');
      } else if (!authError) {
        setError('Giriş başarısız. Lütfen tekrar deneyin.');
      }
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h1 className={styles.header}>Welcome to Hotel Management System</h1>
      
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h2 className={styles.loginTitle}>Giriş Yap</h2>
        
        {(error || authError) && (
          <p className={styles.errorMessage}>{error || authError}</p>
        )}
        
        <input
          type="text"
          name="username"
          placeholder="Kullanıcı Adı"
          className={styles.inputField}
          value={credentials.username}
          onChange={handleChange}
          disabled={loading}
        />
        
        <input
          type="password"
          name="password"
          placeholder="Şifre"
          className={styles.inputField}
          value={credentials.password}
          onChange={handleChange}
          disabled={loading}
        />
        
        <button 
          type="submit" 
          className={styles.loginButton}
          disabled={loading}
        >
          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
};

export default Login; 