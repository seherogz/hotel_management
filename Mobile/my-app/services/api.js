import { Alert } from 'react-native';

// IP adresini kendi bilgisayarının yerel IP'siyle değiştir
const API_BASE_URL = 'http://localhost:5002/api';

/**
 * Authentication service to interact with the backend
 */
export const authService = {
  login: async (email, password) => {
    try {
      console.log('Attempting login with:', email);

      if (email === "test@fail.com") {
        throw new Error('Invalid email or password');
      }

      const response = await fetch(`${API_BASE_URL}/Account/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error.message);
      throw new Error('Invalid email or password');
    }
  },

  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Account/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Account/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Forgot password request failed');
      }

      return data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },
};

/**
 * Customer service to interact with the backend
 */
export const customerService = {
  getAllCustomers: async (pageNumber = 1, pageSize = 10, status = '') => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      let url = `${API_BASE_URL}/v1/Customer?PageNumber=${pageNumber}&PageSize=${pageSize}`;
      if (status) url += `&Status=${status}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customers');
      }

      return data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  getCustomerById: async (id) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${API_BASE_URL}/v1/Customer/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customer');
      }

      return data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  createCustomer: async (customerData) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${API_BASE_URL}/v1/Customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create customer');
      }

      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  /**
   * Update an existing customer
   * @param {number} id - Customer ID
   * @param {Object} customerData - Customer data to update
   * @returns {Promise<Object>} - Response from the API
   */
  updateCustomer: async (id, customerData) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/v1/Customer/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(customerData),
      });

      // Check if the response has content before parsing JSON
      const responseText = await response.text();
      let data = null;
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          // Handle cases where response is not JSON but still indicates success (e.g., 204 No Content)
          if (!response.ok) {
            console.error('Error parsing update response:', parseError);
            throw new Error('Failed to parse server response.');
          }
          // If response is OK but not JSON (like 204), return success indicator
          return { success: true }; 
        }
      } else if (!response.ok) {
         // If response is empty and not OK, throw error
         throw new Error('Failed to update customer with status: ' + response.status);
      }


      if (!response.ok) {
        throw new Error(data?.message || 'Failed to update customer');
      }

      // Return the parsed data or a success indicator if no content
      return data || { success: true };
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  /**
   * Delete a customer
   * @param {number} id - Customer ID
   * @returns {Promise<Object>} - Response from the API (likely empty on success)
   */
  deleteCustomer: async (id) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log(`[customerService.deleteCustomer] Attempting fetch DELETE for ID: ${id}`);

      const response = await fetch(`${API_BASE_URL}/v1/Customer/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log(`[customerService.deleteCustomer] Response status: ${response.status}`);
      
      // DELETE often returns 204 No Content on success
      if (response.ok || response.status === 204) {
        return { success: true }; // Indicate success
      }
      
      // Try to parse error message if available
      let errorMessage = 'Failed to delete customer';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore parsing error if body is empty or not JSON
        console.error('Error parsing delete response:', e);
      }
      throw new Error(errorMessage);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },
};

/**
 * Accounting service to interact with the backend
 */
export const accountingService = {
  // Income methods
  getIncomes: async (pageNumber = 1, pageSize = 10, startDate = null, endDate = null, customerName = null) => {
    try {
      const token = await getAuthToken();
      
      let url = `${API_BASE_URL}/v1/Accounting/incomes?PageNumber=${pageNumber}&PageSize=${pageSize}&version=1`;
      
      if (startDate) url += `&StartDate=${startDate}`;
      if (endDate) url += `&EndDate=${endDate}`;
      if (customerName) url += `&CustomerName=${encodeURIComponent(customerName)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();
      console.log('Income API response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch incomes');
      }

      return data; // Return the complete response object including data array
    } catch (error) {
      console.error('Error fetching incomes:', error);
      throw error;
    }
  },

  addIncome: async (incomeData) => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/v1/Accounting/incomes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(incomeData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add income');
      }

      return data;
    } catch (error) {
      console.error('Error adding income:', error);
      throw error;
    }
  },

  updateIncome: async (id, incomeData) => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/v1/Accounting/incomes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ ...incomeData, id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update income');
      }

      return data;
    } catch (error) {
      console.error('Error updating income:', error);
      throw error;
    }
  },

  deleteIncome: async (id) => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/v1/Accounting/incomes/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Delete income response:', data);
        return { success: true, id: data.id };
      }
      
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete income');
    } catch (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  },

  // Expense methods
  getExpenses: async (pageNumber = 1, pageSize = 10, startDate = null, endDate = null, category = null) => {
    try {
      const token = await getAuthToken();
      
      let url = `${API_BASE_URL}/v1/Accounting/expenses?PageNumber=${pageNumber}&PageSize=${pageSize}&version=1`;
      
      if (startDate) url += `&StartDate=${startDate}`;
      if (endDate) url += `&EndDate=${endDate}`;
      if (category) url += `&Category=${encodeURIComponent(category)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();
      console.log('Expense API response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch expenses');
      }

      return data; // Return the complete response object including data array
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  addExpense: async (expenseData) => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/v1/Accounting/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(expenseData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add expense');
      }

      return data;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  },

  updateExpense: async (id, expenseData) => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/v1/Accounting/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ ...expenseData, id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update expense');
      }

      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  deleteExpense: async (id) => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/v1/Accounting/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Delete expense response:', data);
        return { success: true, id: data.id };
      }
      
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete expense');
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  // Transaction summary
  getTransactionSummary: async (date = null) => {
    try {
      const token = await getAuthToken();
      
      let url = `${API_BASE_URL}/v1/Accounting/transactions/summary`;
      if (date) url += `?date=${date}&version=1`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transaction summary');
      }

      return data;
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
      throw error;
    }
  },
};

/**
 * Reservation service to interact with the backend
 */
export const reservationService = {
  /**
   * Get check-ins with optional filters
   * @param {Object} params - Filter params: { pageNumber, pageSize, checkInDate, reservationId, customerName }
   * @returns {Promise<Object>} - Paged response with check-ins
   */
  getCheckIns: async ({ pageNumber = 1, pageSize = 10, checkInDate = '', reservationId = '', customerName = '' } = {}) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      let url = `${API_BASE_URL}/v1/Reservation/check-ins?PageNumber=${pageNumber}&PageSize=${pageSize}`;
      if (checkInDate) url += `&CheckInDate=${encodeURIComponent(checkInDate)}`;
      if (reservationId) url += `&ReservationId=${encodeURIComponent(reservationId)}`;
      if (customerName) url += `&CustomerName=${encodeURIComponent(customerName)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch check-ins');
      }

      return data;
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      throw error;
    }
  },
  /**
   * Check-in action for a reservation
   * @param {number|string} reservationId
   * @returns {Promise<Object>} - Response from the API
   */
  checkIn: async (reservationId) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      // API'nin istediği gerçek endpoint ve metod: POST /v1/Reservation/{id}/check-in
      const response = await fetch(`${API_BASE_URL}/v1/Reservation/${reservationId}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // Boş body ile istek yapıyoruz, ID zaten URL'de
      });

      const responseText = await response.text();
      let data = {};
      
      if (responseText && responseText.trim() !== '') {
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          // Empty or non-JSON response, but could still be successful
        }
      }
      
      if (!response.ok) {
        throw new Error(data.message || `Check-in işlemi başarısız (HTTP Kodu: ${response.status}).`);
      }

      return data || { success: true };
    } catch (error) {
      console.error('Error during check-in:', error);
      throw error;
    }
  },
  
  /**
   * Check-out action for a reservation
   * @param {number|string} reservationId
   * @returns {Promise<Object>} - Response from the API
   */
  checkOut: async (reservationId) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      // API'nin istediği gerçek endpoint ve metod: POST /v1/Reservation/{id}/check-out
      const response = await fetch(`${API_BASE_URL}/v1/Reservation/${reservationId}/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // Boş body ile istek yapıyoruz, ID zaten URL'de
      });

      const responseText = await response.text();
      let data = {};
      
      if (responseText && responseText.trim() !== '') {
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          // Empty or non-JSON response, but could still be successful
        }
      }
      
      if (!response.ok) {
        throw new Error(data.message || `Check-out işlemi başarısız (HTTP Kodu: ${response.status}).`);
      }

      return data || { success: true };
    } catch (error) {
      console.error('Error during check-out:', error);
      throw error;
    }
  },
  
  /**
   * Get check-outs with optional filters
   * @param {Object} params - Filter params: { pageNumber, pageSize, checkOutDate, reservationId, customerName }
   * @returns {Promise<Object>} - Paged response with check-outs
   */
  getCheckOuts: async ({ pageNumber = 1, pageSize = 10, checkOutDate = '', reservationId = '', customerName = '' } = {}) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      let url = `${API_BASE_URL}/v1/Reservation/check-outs?PageNumber=${pageNumber}&PageSize=${pageSize}`;
      if (checkOutDate) url += `&CheckOutDate=${encodeURIComponent(checkOutDate)}`;
      if (reservationId) url += `&ReservationId=${encodeURIComponent(reservationId)}`;
      if (customerName) url += `&CustomerName=${encodeURIComponent(customerName)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch check-outs');
      }

      return data;
    } catch (error) {
      console.error('Error fetching check-outs:', error);
      throw error;
    }
  },
};

/**
 * Helper function to get the auth token from AsyncStorage
 */
const getAuthToken = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};
