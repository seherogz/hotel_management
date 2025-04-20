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
      
      // Store token and user info in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('isAuthenticated', 'true');
        return response.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Simplified register user method
  registerUserSimple: async (userData, autoLogin = false) => {
    try {
      // Send registration request with camelCase property names
      await apiClient.post('/Account/register', userData);
      
      // If auto login is enabled, login with the new credentials
      if (autoLogin) {
        await authService.login(userData.email, userData.password);
      }
      
      return { succeeded: true };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
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
            throw error1;
          }
        }
      }
      
      console.log('Register API response:', response.data);
      
      // If autoLogin is true, authenticate the new user immediately
      if (autoLogin && response.data && response.data.succeeded) {
        try {
          // Auto-login with the new user credentials
          const loginResponse = await authService.login(userData.email, userData.password);
          return { ...response.data, autoLoginSuccess: true, user: loginResponse.user, message: 'Kullanıcı başarıyla oluşturuldu ve giriş yapıldı' };
        } catch (loginError) {
          console.error('Auto-login after registration failed:', loginError);
          return { ...response.data, autoLoginSuccess: false, message: 'Kullanıcı başarıyla oluşturuldu, fakat otomatik giriş yapılamadı' };
        }
      }
      
      return { ...response.data, message: 'Kullanıcı başarıyla oluşturuldu' };
    } catch (error) {
      console.error('Register error:', error);
      
      // Handle different error response formats
      if (error.response && error.response.data) {
        // Try to normalize the error format for consistent handling in components
        const responseData = error.response.data;
        
        // Log the full error response for debugging
        console.log('Error response status:', error.response.status);
        console.log('Error response headers:', error.response.headers);
        console.log('Error response data:', JSON.stringify(responseData, null, 2));
        
        if (typeof responseData === 'string') {
          // If the response is just a string
          error.normalizedError = {
            message: responseData,
            errors: [responseData]
          };
        } else if (responseData.message && !responseData.errors) {
          // If there's a message but no errors array
          error.normalizedError = {
            message: responseData.message,
            errors: [responseData.message]
          };
        } else if (responseData.errors && Array.isArray(responseData.errors)) {
          // If errors is already an array
          error.normalizedError = responseData;
        } else if (responseData.errors && typeof responseData.errors === 'object') {
          // If errors is an object with key-value pairs
          const errorsArray = [];
          Object.entries(responseData.errors).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              errorsArray.push(...value);
            } else {
              errorsArray.push(value);
            }
          });
          error.normalizedError = {
            message: responseData.message || 'Doğrulama hatası',
            errors: errorsArray
          };
        } else {
          // Default case
          error.normalizedError = {
            message: 'Kayıt işlemi başarısız',
            errors: ['Bilinmeyen bir hata oluştu']
          };
        }
      }
      
      throw error;
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
    return !!localStorage.getItem('token');
  },
  
  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default authService; 