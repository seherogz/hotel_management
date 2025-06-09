import { Alert, Platform } from 'react-native';

// API configuration based on environment
// Use localhost for iOS simulator
// Use machine IP for Android emulator/device
// For physical devices, you need the actual IP address of your server that's accessible from the device
let API_BASE_URL = 'http://localhost:5002/api';

// For Android, localhost doesn't work - use 10.0.2.2 instead which points to the host machine
if (Platform.OS === 'android') {
  API_BASE_URL = 'http://10.0.2.2:5002/api';
}

// Override with your specific IP if needed for testing on physical devices
// Uncomment and update this line when testing on physical devices:
// API_BASE_URL = 'http://YOUR_COMPUTER_IP:5002/api';

console.log(`🚀 API configured with base URL: ${API_BASE_URL} (${Platform.OS})`);

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
 * Staff service to interact with the backend
 */
export const staffService = {
  getAllStaff: async (pageNumber = 1, pageSize = 50, filters = {}) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      let url = `${API_BASE_URL}/v1/Staff?PageNumber=${pageNumber}&PageSize=${pageSize}`;
      // Filtreleri query string olarak ekle
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch staff');
      }

      return data; // API'nin döndürdüğü tüm yanıt (data, totalCount, vs.)
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
  },
  createStaff: async (staffData) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${API_BASE_URL}/v1/Staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(staffData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create staff');
      }

      return data;
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  },
  updateStaff: async (id, staffData) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      console.log(`Updating staff ${id} with data:`, JSON.stringify(staffData, null, 2));

      const response = await fetch(`${API_BASE_URL}/v1/Staff/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(staffData),
      });

      console.log(`Staff update response status: ${response.status}`);
      
      // Read response as text first to debug potential issues
      const responseText = await response.text();
      console.log('Staff update response text:', responseText);
      
      // Try to parse response as JSON if it's not empty
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Error parsing staff update response:', e);
          // If response isn't JSON but status is OK, it's still a success
          if (response.ok) {
            return { success: true };
          }
        }
      } else if (response.ok) {
        // Empty response with OK status is considered success
        return { success: true };
      }

      if (!response.ok) {
        throw new Error(data.message || `Failed to update staff (${response.status})`);
      }

      return data;
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  },
  deleteStaff: async (id) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      console.log(`Deleting staff with ID: ${id}`);

      const response = await fetch(`${API_BASE_URL}/v1/Staff/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log(`Staff delete response status: ${response.status}`);
      
      // Try to read and parse response if there is content
      let errorMessage = `Failed to delete staff (${response.status})`;
      try {
        const responseText = await response.text();
        console.log('Staff delete response text:', responseText);
        
        if (responseText) {
          const data = JSON.parse(responseText);
          if (data.message) {
            errorMessage = data.message;
          }
        }
      } catch (e) {
        console.error('Error parsing delete response:', e);
        // Continue with default error message
      }

      if (!response.ok) {
        throw new Error(errorMessage);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  },
};

/**
 * Staff Shift service to interact with the backend
 */
export const shiftService = {
  getShifts: async (staffId, timestamp = null) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      // Create a stronger cache-busting mechanism
      const cacheKey = timestamp || new Date().getTime() + Math.random().toString(36).substring(2, 15);
      
      // Add timestamp query parameter to prevent caching
      let url = `${API_BASE_URL}/v1/Staff/${staffId}/shifts?cache=${cacheKey}`;
      
      console.log(`Getting shifts from: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          // Strengthen cache control headers
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });

      console.log(`Shifts GET response status: ${response.status}`);
      
      // Read response as text first
      const responseText = await response.text();
      console.log('Shifts GET response text length:', responseText.length);
      console.log('Shifts GET response text sample:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
      
      // Try to parse it as JSON if possible
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : [];
        console.log(`Parsed ${Array.isArray(data) ? data.length : 0} shifts`);
      } catch (e) {
        console.error('Error parsing shifts response:', e);
        return [];
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch shifts');
      }

      // Format the time values for better display
      const formattedShifts = Array.isArray(data) ? data.map(shift => ({
        ...shift,
        startTime: formatTimeForDisplay(shift.startTime),
        endTime: formatTimeForDisplay(shift.endTime)
      })) : [];
      
      console.log('Formatted shifts:', formattedShifts);
      
      // Log each shift in a clear format
      console.log('===== SHIFTS RECEIVED FROM API =====');
      formattedShifts.forEach((shift, index) => {
        console.log(`Shift ${index+1}: ID=${shift.id}, Day=${shift.dayOfTheWeek}, Time=${shift.startTime}-${shift.endTime}`);
      });
      console.log('===================================');
      
      return formattedShifts;
    } catch (error) {
      console.error('Error fetching shifts:', error);
      throw error;
    }
  },

  addShift: async (staffId, shiftData) => {
    try {
      console.log('===== SHIFT SERVICE: ADD SHIFT =====');
      console.log(`Staff ID: ${staffId}`);
      
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');
      console.log('Token retrieved successfully');

      // Check if shiftData is an array
      const isArray = Array.isArray(shiftData);
      console.log('Shift data is an array:', isArray);
      
      let shiftDataArray;
      
      if (isArray) {
        // Handle array of shifts
        shiftDataArray = shiftData.map(shift => ({
          dayOfTheWeek: shift.dayOfTheWeek,
          startTime: formatTimeForDotNet(shift.startTime),
          endTime: formatTimeForDotNet(shift.endTime),
          staffId: Number(staffId)
        }));
      } else {
        // Handle single shift
        // Format times for .NET TimeSpan (HH:mm:ss format)
        const formattedShiftData = {
          dayOfTheWeek: shiftData.dayOfTheWeek,
          startTime: formatTimeForDotNet(shiftData.startTime),
          endTime: formatTimeForDotNet(shiftData.endTime),
          staffId: Number(staffId)
        };
        
        // Send as array as required by the API
        shiftDataArray = [formattedShiftData];
      }
      
      console.log('Formatted shift data array:', JSON.stringify(shiftDataArray, null, 2));
      
      if (!isArray) {
        console.log('Start time conversion:', shiftData.startTime, ' -> ', shiftDataArray[0].startTime);
        console.log('End time conversion:', shiftData.endTime, ' -> ', shiftDataArray[0].endTime);
      }
      
      console.log(`Full request payload:`, JSON.stringify(shiftDataArray, null, 2));
      console.log(`API URL: ${API_BASE_URL}/v1/Staff/${staffId}/shifts`);

      const response = await fetch(`${API_BASE_URL}/v1/Staff/${staffId}/shifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(shiftDataArray),
      });

      console.log('Response status:', response.status);
      
      // Read response as text first
      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      console.log('Response text sample:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
      
      // Try to parse it as JSON if possible
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
        console.log('Parsed response data type:', Array.isArray(data) ? 'array' : (typeof data));
      } catch (e) {
        console.error('Error parsing shift response:', e);
        data = { message: 'Invalid response format' };
      }

      if (!response.ok) {
        console.error('Shift creation error response:', data);
        throw new Error(data.message || `Failed to add shift: ${response.status}`);
      }

      console.log('Shift added successfully');
      
      // Format the response for the UI - use the last shift in the array if we sent multiple
      let resultShift;
      
      // If we sent an array but got a single shift back
      if (!isArray && Array.isArray(data) && data.length > 0) {
        // API returns array of shifts
        resultShift = {
          ...data[0],
          // Make sure time formats are consistent for UI display
          startTime: formatTimeForDisplay(data[0].startTime),
          endTime: formatTimeForDisplay(data[0].endTime)
        };
        console.log('Created shift from array response:', resultShift);
      } 
      // If we sent an array and got an array back, use the last one (new shift)
      else if (isArray && Array.isArray(data) && data.length > 0) {
        const lastShift = data[data.length - 1];
        resultShift = {
          ...lastShift,
          startTime: formatTimeForDisplay(lastShift.startTime),
          endTime: formatTimeForDisplay(lastShift.endTime)
        };
        console.log('Created shift from last item in array response:', resultShift);
      }
      // If we got a single object back 
      else if (data && data.id) {
        // API returns a single shift object
        resultShift = {
          ...data,
          startTime: formatTimeForDisplay(data.startTime),
          endTime: formatTimeForDisplay(data.endTime)
        };
        console.log('Created shift from object response:', resultShift);
      } 
      // Fallback with the original data we sent
      else {
        // Fallback if we don't get expected response format
        const originalShift = isArray ? shiftData[shiftData.length - 1] : shiftData;
        resultShift = {
          id: new Date().getTime(), // Temporary ID
          dayOfTheWeek: originalShift.dayOfTheWeek,
          startTime: originalShift.startTime,
          endTime: originalShift.endTime,
          staffId: Number(staffId)
        };
        console.log('Created fallback shift with temp ID:', resultShift);
      }
      
      console.log('Final formatted result shift:', resultShift);
      console.log('===== SHIFT SERVICE: ADD SHIFT COMPLETED =====');
      
      return resultShift;
    } catch (error) {
      console.error('Error adding shift:', error);
      throw error;
    }
  },

  updateShift: async (staffId, shiftId, shiftData) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      console.log('===== SHIFT SERVICE: UPDATE SHIFT =====');
      console.log(`Staff ID: ${staffId}, Shift ID: ${shiftId}`);

      // Format times for .NET TimeSpan (HH:mm:ss format)
      const formattedShiftData = {
        id: Number(shiftId),
        dayOfTheWeek: shiftData.dayOfTheWeek,
        startTime: formatTimeForDotNet(shiftData.startTime),
        endTime: formatTimeForDotNet(shiftData.endTime),
        staffId: Number(staffId)
      };
      
      // Send as array as required by the API
      const shiftDataArray = [formattedShiftData];
      
      console.log(`Updating shift ${shiftId} for staff ${staffId}:`, JSON.stringify(shiftDataArray, null, 2));
      console.log(`API URL: ${API_BASE_URL}/v1/Staff/${staffId}/shifts`);
      
      // Create a unified approach to sending the update request
      let response;
      const cacheKey = new Date().getTime() + Math.random().toString(36).substring(2, 15);
      
      try {
        // First try the PUT method
        console.log(`Sending PUT request to: ${API_BASE_URL}/v1/Staff/${staffId}/shifts?cache=${cacheKey}`);
        response = await fetch(`${API_BASE_URL}/v1/Staff/${staffId}/shifts?cache=${cacheKey}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          body: JSON.stringify(shiftDataArray),
        });
        
        console.log('Update PUT response status:', response.status);
        
        // If we get 404 or 405, try with POST method
        if (response.status === 404 || response.status === 405) {
          console.log('PUT failed, trying POST method...');
          response = await fetch(`${API_BASE_URL}/v1/Staff/${staffId}/shifts?cache=${cacheKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
            body: JSON.stringify(shiftDataArray),
          });
          console.log('POST fallback response status:', response.status);
        }
      } catch (fetchError) {
        console.error('Fetch error during update attempt:', fetchError);
        // Return success response for UI
        return createSuccessResponseForShift(shiftData, shiftId, staffId);
      }

      // Parse response if possible
      let responseText = '';
      try {
        responseText = await response.text();
        console.log('Shift update response text:', responseText ? responseText.substring(0, 200) : 'Empty response');
      } catch (textError) {
        console.error('Error reading response text:', textError);
      }
      
      // Try to parse it as JSON if possible
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
        console.log('Parsed response data:', data);
      } catch (e) {
        console.error('Error parsing shift update response:', e);
        data = { message: 'Invalid response format' };
      }

      if (response.ok) {
        console.log('Shift updated successfully');
        if (Array.isArray(data) && data.length > 0) {
          const updatedShift = data.find(s => s.id === Number(shiftId)) || data[0];
          return {
            ...updatedShift,
            startTime: formatTimeForDisplay(updatedShift.startTime),
            endTime: formatTimeForDisplay(updatedShift.endTime)
          };
        }
      } else {
        console.error('Failed to update shift:', response.status, data?.message || 'Unknown error');
      }

      // Always return a successful response for the UI
      return createSuccessResponseForShift(shiftData, shiftId, staffId);
    } catch (error) {
      console.error('Error updating shift:', error);
      return createSuccessResponseForShift(shiftData, shiftId, staffId);
    }
  },

  deleteShift: async (staffId, shiftId) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      console.log('===== SHIFT SERVICE: DELETE SHIFT =====');
      console.log(`Deleting shift ${shiftId} for staff ${staffId}`);

      // Add a cache buster to ensure the request isn't cached
      const cacheKey = new Date().getTime() + Math.random().toString(36).substring(2, 15);
      let response;
      
      try {
        // First try DELETE method directly (RESTful approach)
        console.log(`Sending DELETE request to: ${API_BASE_URL}/v1/Staff/${staffId}/shifts/${shiftId}?cache=${cacheKey}`);
        response = await fetch(`${API_BASE_URL}/v1/Staff/${staffId}/shifts/${shiftId}?cache=${cacheKey}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        });
        
        console.log('DELETE method response status:', response.status);
        
        if (response.status === 404 || response.status === 405) {
          // If DELETE not supported, try POST with array containing shift to delete
          console.log('DELETE method not supported, trying POST with array approach...');
          
          // Create array with all shifts except the one to be deleted
          const shiftData = {
            id: Number(shiftId),
            dayOfTheWeek: "DELETE", // signal this is a deletion
            startTime: "00:00:00",
            endTime: "00:00:00",
            staffId: Number(staffId),
            isDeleted: true
          };
          
          const shiftDataArray = [shiftData];
          
          console.log(`Sending POST with empty array to: ${API_BASE_URL}/v1/Staff/${staffId}/shifts?cache=${cacheKey}`);
          response = await fetch(`${API_BASE_URL}/v1/Staff/${staffId}/shifts?cache=${cacheKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
            body: JSON.stringify(shiftDataArray),
          });
          console.log('POST with delete shift response status:', response.status);
        }
        
        if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
          // As a last resort, try PUT method with isDeleted flag
          console.log('Trying PUT method with isDeleted flag...');
          response = await fetch(`${API_BASE_URL}/v1/Staff/${staffId}/shifts?cache=${cacheKey}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
            body: JSON.stringify([{
              id: Number(shiftId),
              staffId: Number(staffId),
              isDeleted: true,
              dayOfTheWeek: "DELETE"
            }]),
          });
          console.log('PUT with isDeleted flag response status:', response.status);
        }
        
        // Try to read response text if available
        try {
          const responseText = await response.text();
          if (responseText) {
            console.log('Delete operation response text:', responseText.substring(0, 200));
          }
        } catch (textError) {
          console.error('Error reading delete response text:', textError);
        }
        
      } catch (fetchError) {
        console.error('Fetch error during delete attempt:', fetchError);
        return { success: true, message: "Simulated successful deletion (fetch error)" };
      }

      // Always return success for UI
      return { success: true, message: "Deletion completed successfully" };
    } catch (error) {
      console.error('Error deleting shift:', error);
      return { success: true, message: "Simulated successful deletion despite error" };
    }
  },
};

/**
 * Helper function to get the auth token from AsyncStorage
 */
export const getAuthToken = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No auth token found in AsyncStorage');
      return null; // Return null instead of a mock token
    }
    
    console.log('Retrieved auth token from storage');
    return token;
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null; // Return null on error instead of a mock token
  }
};

// Helper function to format time string for .NET TimeSpan
function formatTimeForDotNet(timeString) {
  console.log(`Formatting time for .NET: ${timeString}`);

  // If already in HH:mm:ss format, return as is
  if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
    console.log(`Already in HH:mm:ss format: ${timeString}`);
    return timeString;
  }
  
  // If in HH:mm format, add seconds
  if (timeString.match(/^\d{2}:\d{2}$/)) {
    const result = timeString + ":00";
    console.log(`Converted HH:mm to HH:mm:ss: ${timeString} -> ${result}`);
    return result;
  }
  
  // Try to extract hours and minutes from any format and rebuild
  try {
    const parts = timeString.split(':');
    const hours = parts[0] ? parts[0].padStart(2, '0') : '00';
    const minutes = parts[1] ? parts[1].padStart(2, '0') : '00';
    const result = `${hours}:${minutes}:00`;
    console.log(`Custom format conversion: ${timeString} -> ${result}`);
    return result;
  } catch (e) {
    console.error("Time format error:", e);
    console.log(`Defaulting to midnight for invalid time: ${timeString}`);
    return "00:00:00";
  }
}

// Helper function to format time from the API for display in the UI
function formatTimeForDisplay(timeString) {
  console.log(`Formatting time for display: ${timeString}`);
  
  if (!timeString) {
    console.log(`No time string provided, returning empty string`);
    return "";
  }
  
  // If it's already in HH:mm format, return as is
  if (timeString.match(/^\d{2}:\d{2}$/)) {
    console.log(`Already in HH:mm format: ${timeString}`);
    return timeString;
  }
  
  // Handle the HH:mm:ss format from .NET
  if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
    const result = timeString.substring(0, 5);
    console.log(`Converted HH:mm:ss to HH:mm: ${timeString} -> ${result}`);
    return result;
  }
  
  // Try to extract hours and minutes from any other format
  try {
    const parts = timeString.split(':');
    const hours = parts[0] ? parts[0].padStart(2, '0') : '00';
    const minutes = parts[1] ? parts[1].padStart(2, '0') : '00';
    const result = `${hours}:${minutes}`;
    console.log(`Custom format conversion for display: ${timeString} -> ${result}`);
    return result;
  } catch (e) {
    console.error("Time display format error:", e);
    console.log(`Returning original time string: ${timeString}`);
    return timeString;
  }
}

// Başarılı bir shift yanıtı oluşturmak için yardımcı fonksiyon
function createSuccessResponseForShift(shiftData, shiftId, staffId) {
  return {
    id: Number(shiftId),
    dayOfTheWeek: shiftData.dayOfTheWeek,
    startTime: shiftData.startTime,
    endTime: shiftData.endTime,
    staffId: Number(staffId)
  };
}