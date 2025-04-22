// src/services/authService.js

import apiClient from './apiService';

// Authentication service
const authService = {
  // Login method
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/Account/authenticate', {
        email: email,
        password: password
      });

      // Yanıt verisini (response.data) kontrol et
      console.log("Login API Response Data:", response.data);

      // Token ve kullanıcı bilgisini localStorage'a kaydet
      // Eğer token ve roller doğrudan response.data içinde ise:
      if (response.data && response.data.jwToken && response.data.roles) { // Token ve rollerın varlığını kontrol et
        localStorage.setItem('token', response.data.jwToken); // Token'ı doğru alandan al

        // ----- DEĞİŞİKLİK (Önceki adımdaki gibi) -----
        // response.data.user yerine response.data objesinin tamamını 'user' olarak kaydet
        localStorage.setItem('user', JSON.stringify(response.data));
        // ---------------------

        localStorage.setItem('isAuthenticated', 'true');

        // setUser için response.data'yı döndür (AuthContext bunu kullanabilir)
        return response.data;
      } else {
         // Eğer backend farklı bir yapı döndürüyorsa (örn: response.data.result.user)
         // veya token/roller eksikse hata yönetimi yapılmalı
         console.error('Login response is missing token or user data:', response.data);
         // Belki backend'in döndürdüğü bir hata mesajı vardır
         throw new Error(response.data?.message || 'Login failed: Invalid response structure');
      }

    } catch (error) {
      console.error('Login error:', error.response?.data || error.message || error);
      // Hata objesini veya mesajını fırlat
      // Backend'den gelen hata mesajını önceliklendir
      const errorMessage = error.response?.data?.message || error.message || 'Login error occurred';
      throw new Error(errorMessage); // Hata mesajını fırlat
    }
  },

  // Simplified register user method
  registerUserSimple: async (userData, autoLogin = false) => {
    try {
      // Send registration request with camelCase property names
      await apiClient.post('/Account/register', userData);

      // If auto login is enabled, login with the new credentials
      if (autoLogin) {
        // Login fonksiyonu artık tüm kullanıcı verisini döndürüyor
        await authService.login(userData.email, userData.password);
      }

      return { succeeded: true };
    } catch (error) {
      console.error('Registration error:', error);
      // Backend'den gelen hata mesajını önceliklendir
      const errorMessage = error.response?.data?.message || error.message || 'Registration error occurred';
      throw new Error(errorMessage); // Hata mesajını fırlat
    }
  },

  // Register a new user (admin only)
  registerUser: async (userData, autoLogin = false) => {
    try {
      // Format the request with camelCase property names to match DTO format
      const requestData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        userName: userData.userName,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
        // If roles is an array, keep it as is, otherwise convert to array
        roles: Array.isArray(userData.roles) ? userData.roles :
               (userData.roles ? [userData.roles] : []),
        // Add origin parameter which backend might be expecting
        origin: window.location.origin
      };

      // Log the request for debugging
      console.log('Register API request payload:', requestData);

      // Try multiple approaches to cover different backend implementations
      let response;
      try {
        // First try: standard endpoint with camelCase properties
        response = await apiClient.post('/Account/register', requestData);
      } catch (error1) {
        console.log('First registration attempt failed, trying alternative approach...');
        try {
          // Second try: with origin as query parameter
          const url = '/Account/register?origin=' + encodeURIComponent(window.location.origin);
          response = await apiClient.post(url, requestData);
        } catch (error2) {
          console.log('Second registration attempt failed, trying PascalCase format...');
          try {
            // Third try: try with PascalCase property names (legacy format)
            response = await apiClient.post('/Account/register', {
              FirstName: userData.firstName,
              LastName: userData.lastName,
              Email: userData.email,
              UserName: userData.userName,
              Password: userData.password,
              ConfirmPassword: userData.confirmPassword,
              Roles: Array.isArray(userData.roles) ? userData.roles :
                    (userData.roles ? [userData.roles] : []),
              Origin: window.location.origin
            });
          } catch (error3) {
            // All attempts failed, rethrow the original error
            console.error('All registration attempts failed');
            throw error1; // Orijinal hatayı fırlat
          }
        }
      }

      console.log('Register API response:', response.data);

      // If autoLogin is true, authenticate the new user immediately
      if (autoLogin && response.data && response.data.succeeded) {
        try {
          // Auto-login with the new user credentials
          // login fonksiyonu artık tüm kullanıcı verisini döndürüyor
          const loginResponse = await authService.login(userData.email, userData.password);
          // loginResponse'un kendisi kullanıcı bilgilerini içeriyor olmalı
          return { ...response.data, autoLoginSuccess: true, user: loginResponse, message: 'Kullanıcı başarıyla oluşturuldu ve giriş yapıldı' };
        } catch (loginError) {
          console.error('Auto-login after registration failed:', loginError);
          // loginError'dan gelen mesajı kullan
          const autoLoginErrorMessage = loginError.message || 'Otomatik giriş yapılamadı';
          return { ...response.data, autoLoginSuccess: false, message: `Kullanıcı başarıyla oluşturuldu, fakat otomatik giriş yapılamadı: ${autoLoginErrorMessage}` };
        }
      }

      // Sadece kayıt başarılı olduysa
      if (response.data && response.data.succeeded) {
         return { ...response.data, message: 'Kullanıcı başarıyla oluşturuldu' };
      } else {
         // Kayıt başarısızsa, backend'den gelen mesajı fırlat
         throw new Error(response.data?.message || 'Kullanıcı kaydı başarısız oldu.');
      }

    } catch (error) {
      console.error('Register error:', error.response?.data || error.message || error);

      // Handle different error response formats for UI feedback
      if (error.response && error.response.data) {
        const responseData = error.response.data;
        console.log('Error response data:', JSON.stringify(responseData, null, 2));

        if (typeof responseData === 'string') {
          error.normalizedError = { message: responseData, errors: [responseData] };
        } else if (responseData.message && !responseData.errors) {
          error.normalizedError = { message: responseData.message, errors: [responseData.message] };
        } else if (responseData.errors && Array.isArray(responseData.errors)) {
          error.normalizedError = responseData; // Assume structure is { message: '...', errors: [...] }
        } else if (responseData.errors && typeof responseData.errors === 'object') {
          const errorsArray = Object.entries(responseData.errors).flatMap(([key, value]) =>
            Array.isArray(value) ? value : [value]
          );
          error.normalizedError = { message: responseData.message || 'Doğrulama hatası', errors: errorsArray };
        } else {
          error.normalizedError = { message: responseData.message || 'Kayıt işlemi başarısız', errors: ['Bilinmeyen bir hata oluştu'] };
        }
      } else {
         // Error objesinin kendisi bir mesaj içeriyorsa onu kullan
         error.normalizedError = { message: error.message || 'Kayıt işlemi başarısız', errors: [error.message || 'Bilinmeyen bir hata oluştu'] };
      }

      throw error; // Hatayı fırlatmaya devam et
    }
  },

  // Logout method
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    // Token ve isAuthenticated flag'ini kontrol etmek daha güvenilir
    const token = localStorage.getItem('token');
    const authenticated = localStorage.getItem('isAuthenticated') === 'true';
    return !!token && authenticated; // Hem token olmalı hem de flag true olmalı
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    try {
        // Eğer user verisi varsa ve geçerli bir JSON ise parse et
        return user ? JSON.parse(user) : null;
    } catch (e) {
        console.error("Error parsing user data from localStorage", e);
        // Hatalı veriyi temizle
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        return null;
    }
  }
};

export default authService;