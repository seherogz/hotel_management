// apiService.js - API functions for Room Status
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const ROOMS_ENDPOINT = `${API_BASE_URL}/rooms`;
const CUSTOMERS_ENDPOINT = `${API_BASE_URL}/customers`;
const RESERVATIONS_ENDPOINT = `${API_BASE_URL}/reservations`;

/**
 * Fetches all rooms from the API
 * @returns {Promise<Array>} Array of room objects
 */
export const fetchRooms = async () => {
  try {
    const response = await fetch(ROOMS_ENDPOINT);
    
    if (!response.ok) {
      throw new Error(`Error fetching rooms: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    // Return empty array on error, so the UI can handle it gracefully
    return [];
  }
};

/**
 * Fetches available rooms for a specific date range
 * @param {Date} startDate - Check-in date
 * @param {Date} endDate - Check-out date
 * @returns {Promise<Array>} Array of available room objects
 */
export const fetchAvailableRooms = async (startDate, endDate) => {
  try {
    // Format dates as ISO strings
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    const queryParams = new URLSearchParams({
      startDate: formattedStartDate,
      endDate: formattedEndDate
    });
    
    const response = await fetch(`${ROOMS_ENDPOINT}/available?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching available rooms: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return [];
  }
};

/**
 * Finds a customer by email or creates a new one
 * @param {Object} customerData - Customer information
 * @returns {Promise<Object>} Customer object with exists flag
 */
export const findOrCreateCustomer = async (customerData) => {
  try {
    // First try to find the customer by email
    const response = await fetch(`${CUSTOMERS_ENDPOINT}/find-by-email?email=${encodeURIComponent(customerData.email)}`);
    
    if (response.ok) {
      const existingCustomer = await response.json();
      
      // If customer exists, return it with exists flag
      if (existingCustomer && existingCustomer.id) {
        return {
          customer: existingCustomer,
          exists: true
        };
      }
    }
    
    // If customer not found, create a new one
    const createResponse = await fetch(CUSTOMERS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customerData)
    });
    
    if (!createResponse.ok) {
      throw new Error(`Error creating customer: ${createResponse.statusText}`);
    }
    
    const newCustomer = await createResponse.json();
    
    return {
      customer: newCustomer,
      exists: false
    };
  } catch (error) {
    console.error('Error in findOrCreateCustomer:', error);
    throw error;
  }
};

/**
 * Creates a new reservation
 * @param {Object} reservationData - Reservation information
 * @returns {Promise<Object>} Created reservation object
 */
export const createReservation = async (reservationData) => {
  try {
    // Get JWT token
    const token = localStorage.getItem('token');
    
    // Format dates for API and prepare required payload format
    const formattedData = {
      customerId: reservationData.customerId,
      roomId: reservationData.roomId,
      startDate: reservationData.startDate.toISOString().split('T')[0],
      endDate: reservationData.endDate.toISOString().split('T')[0],
      numberOfGuests: reservationData.numberOfGuests || 2,
      price: reservationData.totalPrice || reservationData.price,
      status: "Confirmed"
    };
    
    const response = await fetch(RESERVATIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(formattedData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error creating reservation: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

/**
 * Updates room status (e.g. mark as under maintenance)
 * @param {string} roomId - Room ID
 * @param {string} status - New room status
 * @returns {Promise<Object>} Updated room object
 */
export const updateRoomStatus = async (roomId, status) => {
  try {
    const response = await fetch(`${ROOMS_ENDPOINT}/${roomId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error(`Error updating room status: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating room status:', error);
    throw error;
  }
};

/**
 * Fetches room with its current reservation details
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Room object with reservation details
 */
export const fetchRoomWithReservation = async (roomId) => {
  try {
    const response = await fetch(`${ROOMS_ENDPOINT}/${roomId}/with-reservation`);
    
    if (!response.ok) {
      throw new Error(`Error fetching room details: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching room details:', error);
    throw error;
  }
};

/**
 * Cancels an existing reservation
 * @param {string} reservationId - Reservation ID to cancel
 * @returns {Promise<Object>} Canceled reservation object
 */
export const cancelReservation = async (reservationId) => {
  try {
    // Get JWT token
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${RESERVATIONS_ENDPOINT}/${reservationId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error canceling reservation: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error canceling reservation:', error);
    throw error;
  }
};

// Format date for API
function formatDateForApi(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // Return YYYY-MM-DD format
} 