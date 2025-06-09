import axios from 'axios';
import { getAuthToken } from './api';
import { Platform } from 'react-native';

// API base URL - should match your backend URL
let API_BASE_URL = 'http://localhost:5002/api';

// For Android, localhost doesn't work - use 10.0.2.2 instead which points to the host machine
if (Platform.OS === 'android') {
  API_BASE_URL = 'http://10.0.2.2:5002/api';
}

// Override with your specific IP if needed for testing on physical devices
// Uncomment and update this line when testing on physical devices:
// API_BASE_URL = 'http://YOUR_COMPUTER_IP:5002/api';

console.log(`🚀 Room Service API configured with base URL: ${API_BASE_URL} (${Platform.OS})`);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in all requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// For testing when API is not accessible
const dummyRooms = [
  {
    "id": 1,
    "roomNumber": "101",
    "roomType": "Standard",
    "floor": 1,
    "capacity": "2",
    "pricePerNight": 500,
    "isOnMaintenance": false,
    "computedStatus": "Available",
    "description": "City view standard room",
    "features": [
      "Wi-Fi",
      "TV",
      "Air Conditioning"
    ],
    "occupantName": null,
    "currentReservationId": null,
    "occupantCheckInDate": null,
    "occupantCheckOutDate": null,
    "maintenanceIssueDescription": null,
    "maintenanceCompletionDate": null
  },
  {
    "id": 2,
    "roomNumber": "102",
    "roomType": "Deluxe",
    "floor": 1,
    "capacity": "4",
    "pricePerNight": 750,
    "isOnMaintenance": false,
    "computedStatus": "Available",
    "description": "Deluxe city view room with extra space",
    "features": [
      "Wi-Fi",
      "TV",
      "Air Conditioning",
      "Minibar"
    ],
    "occupantName": null,
    "currentReservationId": null,
    "occupantCheckInDate": null,
    "occupantCheckOutDate": null,
    "maintenanceIssueDescription": null,
    "maintenanceCompletionDate": null
  }
];

// Room service for interacting with the room endpoints
const roomService = {
  // Get all rooms with optional filters
  getAllRooms: async (params = {}) => {
    try {
      console.log("Getting all rooms with params:", params);
      const response = await apiClient.get('/v1/Room', { params });
      
      // Log the API response to see the actual room data structure
      console.log("Raw room data from API:", JSON.stringify(response.data.data[0], null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms:', error.response?.data || error.message);
      console.log('Using dummy data instead');
      // Return dummy data in the same format as the API response
      return {
        data: dummyRooms,
        pageNumber: 1,
        pageSize: dummyRooms.length,
        totalPages: 1,
        totalCount: dummyRooms.length
      };
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

  // Create a new room
  createRoom: async (roomData) => {
    try {
      console.log("Creating a new room with data:", roomData);
      const response = await apiClient.post('/v1/Room', roomData);
      console.log("Room creation API response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating room:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update an existing room
  updateRoom: async (id, roomData) => {
    try {
      console.log(`Updating room ID ${id} with data:`, roomData);
      const response = await apiClient.put(`/v1/Room/${id}`, roomData);
      console.log("Room update API response:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating room ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Get calendar view data for the specified date range
  getCalendarViewData: async (params) => {
    if (!params.StartDate || !params.EndDate) {
      return Promise.reject(new Error('Takvim görünümü için başlangıç ve bitiş tarihleri gereklidir.'));
    }
    try {
      console.log("Takvim görünümü için API isteği yapılıyor, parametreler:", params);
      const response = await apiClient.get('/v1/Room/CalendarView', { params });
      
      // Log success
      console.log(`Takvim verisi başarıyla alındı. ${response.data ? 
        (Array.isArray(response.data) ? response.data.length : 'Veri yapısı dizi değil') : 
        'Veri yok'} oda.`);
      
      return response.data;
    } catch (error) {
      // Detailed error logging
      console.error('Takvim verisi getirilirken hata:', error);
      if (error.response?.status) {
        console.error(`HTTP Status: ${error.response.status}`);
      }
      if (error.response?.data) {
        console.error('API Error Response:', error.response.data);
      }
      throw error;
    }
  },

  // Create a new reservation - Güncellenmiş API formatı
  reserveRoom: async (reservationData) => {
    try {
      console.log("Creating reservation with raw data:", reservationData);
      // Create a simplified API request data with proper date format
      const apiRequestData = {
        customerIdNumber: reservationData.customerIdNumber.toString(),
        roomId: parseInt(reservationData.roomId),
        // Format dates as simple strings without time portion in YYYY-MM-DD format
        startDate: reservationData.checkInDate,
        endDate: reservationData.checkOutDate,
        numberOfGuests: parseInt(reservationData.numberOfGuests) || 1
      };
      console.log("API Request simplified payload:", JSON.stringify(apiRequestData, null, 2));
      // Doğru şekilde body gönder
      const response = await apiClient.post('/v1/Reservation', apiRequestData);
      console.log("API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating reservation:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Cancel a reservation
  cancelReservation: async (reservationId) => {
    try {
      console.log("Cancelling reservation:", reservationId);
      const response = await apiClient.post(`/v1/Reservation/${reservationId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling reservation:', error.response?.data || error.message);
      throw error;
    }
  },

  // Add maintenance issue to a room
  addMaintenanceIssue: async (roomId, issueData) => {
    try {
      console.log("Adding maintenance issue for room:", roomId, issueData);
      const response = await apiClient.post(`/v1/Room/${roomId}/maintenance-issues`, issueData);
      return response.data;
    } catch (error) {
      console.error('Error adding maintenance issue:', error.response?.data || error.message);
      throw error;
    }
  },

  // Resolve a maintenance issue
  resolveMaintenanceIssue: async (roomId, issueId) => {
    try {
      console.log("Resolving maintenance issue:", roomId, issueId);
      const response = await apiClient.post(`/v1/Room/${roomId}/maintenance-issues/${issueId}/resolve`);
      return response.data;
    } catch (error) {
      console.error('Error resolving maintenance issue:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get amenities for a room
  getRoomAmenities: async (roomId) => {
    try {
      const response = await apiClient.get(`/v1/Room/${roomId}/amenities`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching amenities for room ${roomId}:`, error);
      throw error;
    }
  },

  // Delete a room
  deleteRoom: async (roomId) => {
    try {
      console.log(`Deleting room with ID ${roomId}`);
      const response = await apiClient.delete(`/v1/Room/${roomId}`);
      console.log('Room deletion response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error deleting room ${roomId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Format room data from API to match UI requirements
  formatRoomData: (apiRoom) => {
    // Log the raw room data to see what we're working with
    console.log("Formatting room data:", JSON.stringify(apiRoom, null, 2));
    
    // Find the current reservation if exists
    const currentReservation = apiRoom.reservations?.find(r => 
      new Date(r.checkOutDate) >= new Date() && r.status !== 'Cancelled'
    );

    // Get the current maintenance issue if exists
    const currentMaintenance = apiRoom.maintenanceIssues?.find(m => !m.isResolved);

    // Format date from ISO to DD.MM.YYYY
    const formatDate = (isoDate) => {
      if (!isoDate) return '';
      const date = new Date(isoDate);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };

    // Parse date from DD.MM.YYYY to Date object
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split('.').map(Number);
      return new Date(year, month - 1, day);
    };

    // Today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    // Check if maintenance has ended
    let maintenanceActive = false;
    if (apiRoom.maintenanceIssueDescription) {
      // Check if completion date is in the past
      if (apiRoom.maintenanceCompletionDate) {
        const completionDate = new Date(apiRoom.maintenanceCompletionDate);
        completionDate.setHours(0, 0, 0, 0); // Reset time to start of day
        maintenanceActive = completionDate >= today;
      } else {
        // No end date specified, assume still under maintenance
        maintenanceActive = true;
      }
    }

    // Check if room is currently occupied
    let reservationActive = false;
    if (apiRoom.currentReservationId) {
      // Check if checkout date is in the past
      if (apiRoom.occupantCheckOutDate) {
        const checkoutDate = new Date(apiRoom.occupantCheckOutDate);
        checkoutDate.setHours(0, 0, 0, 0); // Reset time to start of day
        reservationActive = checkoutDate >= today;
      } else {
        // No checkout date specified, assume still occupied
        reservationActive = true;
      }
    }

    // Determine room status
    let status = 'available';
    if (maintenanceActive) {
      status = 'maintenance';
    } else if (reservationActive) {
      status = 'occupied';
    } else {
      status = 'available';
    }

    // Get the definitive numeric ID for the room (this is what the API expects)
    const roomId = apiRoom.roomId || apiRoom.id || 0;
    
    // Build formatted room object
    const formattedRoom = {
      id: roomId,  // Use the numeric ID directly
      roomId: roomId, // Explicitly set roomId
      roomNumber: apiRoom.roomNumber ? apiRoom.roomNumber.toString() : roomId.toString(),
      status,
      capacity: `${apiRoom.capacity} people`,
      amenities: apiRoom.features || [],
      price: `₺${apiRoom.pricePerNight}`,
      pricePerNight: apiRoom.pricePerNight,
      roomType: apiRoom.roomType || 'Standard',
      description: apiRoom.description || 'City view standard room',
      floor: apiRoom.floor || 1,
      features: apiRoom.features || [],
      currentReservationId: reservationActive ? apiRoom.currentReservationId : null,
      maintenanceIssueDescription: maintenanceActive ? apiRoom.maintenanceIssueDescription : null,
      maintenanceCompletionDate: apiRoom.maintenanceCompletionDate,
      occupantCheckOutDate: apiRoom.occupantCheckOutDate
    };

    // Add reservation details if occupied
    if (status === 'occupied') {
      formattedRoom.guest = apiRoom.occupantName || 'Misafir';
      formattedRoom.checkIn = formatDate(apiRoom.occupantCheckInDate);
      formattedRoom.checkOut = formatDate(apiRoom.occupantCheckOutDate);
      formattedRoom.reservationId = apiRoom.currentReservationId;
      formattedRoom.occupantName = apiRoom.occupantName;
      formattedRoom.occupantCheckInDate = formatDate(apiRoom.occupantCheckInDate);
      formattedRoom.occupantCheckOutDate = formatDate(apiRoom.occupantCheckOutDate);
    }

    // Add maintenance details if under maintenance
    if (status === 'maintenance') {
      formattedRoom.maintenance = apiRoom.maintenanceIssueDescription || 'Bakım yapılıyor';
      formattedRoom.expectedCompletion = formatDate(apiRoom.maintenanceCompletionDate);
      formattedRoom.maintenanceId = apiRoom.maintenanceIssueId;
    }

    console.log("Formatted room:", formattedRoom.id, formattedRoom.roomNumber);
    return formattedRoom;
  },

  // Get maintenance issues for a room
  getRoomMaintenanceIssues: async (roomId) => {
    try {
      console.log(`Fetching maintenance issues for room ID ${roomId}`);
      const response = await apiClient.get(`/v1/Room/${roomId}/maintenance-issues`);
      console.log('Maintenance issues response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching maintenance issues for room ${roomId}:`, error);
      throw error;
    }
  },
};

export default roomService; 