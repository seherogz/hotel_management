import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../Layout/MainLayout';
import authService from '../../services/authService';
import styles from './RegisterUser.module.css';

const RegisterUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userName: '',
    password: '',
    confirmPassword: '',
    roles: [],
    phoneNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  const roleOptions = [
    { value: 'Receptionist', label: 'Resepsiyonist' },
    { value: 'AccountingManager', label: 'Muhasebe Müdürü' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'role') {
      // When role changes, update the roles array
      setFormData({ ...formData, roles: value ? [value] : [] });
    } else {
      setFormData({ ...formData, [name]: value });
      
      // If changing password or confirmPassword, check matching
      if (name === 'password' && formData.confirmPassword) {
        if (value !== formData.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: 'Şifreler eşleşmiyor' }));
        } else {
          setErrors(prev => ({ ...prev, confirmPassword: null }));
        }
      }
      if (name === 'confirmPassword' && formData.password) {
        if (value !== formData.password) {
          setErrors(prev => ({ ...prev, confirmPassword: 'Şifreler eşleşmiyor' }));
        } else {
          setErrors(prev => ({ ...prev, confirmPassword: null }));
        }
      }
    }
    
    // Clear the error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCheckboxChange = (e) => {
    setAutoLogin(e.target.checked);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad alanı zorunludur';
    }
    
    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad alanı zorunludur';
    }
    
    // Email validation (RFC 5322 format)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!formData.email) {
      newErrors.email = 'E-posta zorunludur';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Geçersiz e-posta formatı';
    }
    
    // Username validation
    if (!formData.userName) {
      newErrors.userName = 'Kullanıcı adı zorunludur';
    } else if (formData.userName.length < 6) {
      newErrors.userName = 'Kullanıcı adı en az 6 karakter olmalıdır';
    }
    
    // Password validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!formData.password) {
      newErrors.password = 'Şifre zorunludur';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır ve 1 harf ve 1 rakam içermelidir';
    }
    
    // Role validation
    if (!formData.roles || formData.roles.length === 0) {
      newErrors.role = 'Rol zorunludur';
    }
    
    return newErrors;
  };

  // Password match validation function
  const validatePasswordMatch = (password, confirmPassword) => {
    if (!password || !confirmPassword) return true;
    return password === confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear all API errors
    setErrors({});
    
    // Validate form
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    // Extra validation to ensure password and confirmPassword match
    if (!validatePasswordMatch(formData.password, formData.confirmPassword)) {
      setErrors({ confirmPassword: 'Şifreler eşleşmiyor' });
      return;
    }
    
    setIsSubmitting(true);
    
    // Create payload with confirmPassword explicitly set to match password
    const payload = {
      ...formData,
      confirmPassword: formData.password
    };
    
    try {
      await authService.registerUserSimple(payload, autoLogin);
      toast.success('Kullanıcı başarıyla oluşturuldu');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Kayıt işlemi başarısız';
      toast.error(msg);
      console.error('API error message:', msg);
      
      // Set field-specific errors if available
      if (err.response?.data?.errors) {
        const apiErrors = {};
        const errorsData = err.response.data.errors;
        
        if (Array.isArray(errorsData)) {
          // Handle array of error messages
          errorsData.forEach((msg, idx) => {
            apiErrors[`apiError${idx}`] = msg;
          });
        } else if (typeof errorsData === 'object') {
          // Handle object with field-specific errors
          Object.entries(errorsData).forEach(([field, message]) => {
            const fieldName = field.charAt(0).toLowerCase() + field.slice(1);
            apiErrors[fieldName] = Array.isArray(message) ? message[0] : message;
          });
        }
        
        setErrors(apiErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout title="Kullanıcı Kaydı Oluştur">
      <div className={styles.registerContainer}>
        <h2 className={styles.formTitle}>Yeni Kullanıcı Kaydı</h2>
        
        {/* Display API errors at the top if any */}
        {Object.keys(errors).some(key => key.startsWith('apiError')) && (
          <div className={styles.apiErrorContainer}>
            {Object.entries(errors)
              .filter(([key]) => key.startsWith('apiError'))
              .map(([key, value]) => (
                <p key={key} className={styles.apiErrorText}>{value}</p>
              ))}
          </div>
        )}
        
        <form className={styles.registerForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="firstName">Ad</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={errors.firstName ? styles.inputError : ''}
            />
            {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="lastName">Soyad</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={errors.lastName ? styles.inputError : ''}
            />
            {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">E-posta</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? styles.inputError : ''}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="userName">Kullanıcı Adı</label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              className={errors.userName ? styles.inputError : ''}
            />
            {errors.userName && <span className={styles.errorText}>{errors.userName}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="phoneNumber">Telefon Numarası (İsteğe Bağlı)</label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={errors.phoneNumber ? styles.inputError : ''}
            />
            {errors.phoneNumber && <span className={styles.errorText}>{errors.phoneNumber}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">Şifre</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? styles.inputError : ''}
            />
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Şifre Tekrar</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? styles.inputError : ''}
            />
            {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="role">Rol</label>
            <select
              id="role"
              name="role"
              value={formData.roles.length > 0 ? formData.roles[0] : ''}
              onChange={handleChange}
              className={errors.role ? styles.inputError : ''}
            >
              <option value="">Rol seçiniz</option>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            {errors.role && <span className={styles.errorText}>{errors.role}</span>}
          </div>
          
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="autoLogin"
              checked={autoLogin}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="autoLogin">Oluşturulduktan sonra bu kullanıcı ile otomatik giriş yap</label>
          </div>
          
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => navigate('/dashboard')}
              disabled={isSubmitting}
            >
              İptal
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default RegisterUser; 