import apiClient from './apiService';

// Room service
const roomService = {
  // Get all rooms
  getAllRooms: async (params = {}) => {
    try {
      const response = await apiClient.get('/v1/Room', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  },

  // Get available rooms
  getAvailableRooms: async (params = {}) => {
    try {
      const response = await apiClient.get('/v1/Room/available', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      throw error;
    }
  },

  // Get room by ID
  getRoomById: async (id) => {
    try {
      const response = await apiClient.get(`/v1/Room/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching room with ID ${id}:`, error);
      throw error;
    }
  },

  // Reserve a room
  reserveRoom: async (reservationData) => {
    try {
      const response = await apiClient.post('/v1/Room/reserve', reservationData);
      return response.data;
    } catch (error) {
      console.error('Error reserving room:', error);
      throw error;
    }
  },

  // Cancel a reservation
  cancelReservation: async (reservationData) => {
    try {
      const response = await apiClient.post('/v1/Room/cancel-reservation', reservationData);
      return response.data;
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  },

  // Update room maintenance status
  updateMaintenanceStatus: async (maintenanceData) => {
    try {
      const response = await apiClient.post('/v1/Room/update-maintenance-status', maintenanceData);
      return response.data;
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      throw error;
    }
  },

  // Get room amenities
  getRoomAmenities: async (roomId) => {
    try {
      const response = await apiClient.get(`/v1/Room/${roomId}/amenities`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching amenities for room ${roomId}:`, error);
      throw error;
    }
  },

  // Get maintenance issues for a room
  getRoomMaintenanceIssues: async (roomId) => {
    try {
      const response = await apiClient.get(`/v1/Room/${roomId}/maintenance-issues`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching maintenance issues for room ${roomId}:`, error);
      throw error;
    }
  }
};

export default roomService; 