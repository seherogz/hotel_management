import { Platform } from 'react-native';
import { getAuthToken } from './api';

// API configuration is consistent with other services
let API_BASE_URL = 'http://localhost:5002/api';

// For Android, localhost doesn't work - use 10.0.2.2 instead which points to the host machine
if (Platform.OS === 'android') {
  API_BASE_URL = 'http://10.0.2.2:5002/api';
}

const dashboardService = {
  /**
   * Retrieves Dashboard summary information
   * - Room status
   * - Check-in/out information
   * - Revenue summary
   * - Upcoming reservations
   */
  getSummary: async () => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${API_BASE_URL}/v1/Dashboard/Summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }

      return data;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }
};

export default dashboardService; 