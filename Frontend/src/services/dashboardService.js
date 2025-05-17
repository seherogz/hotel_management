import apiClient from './apiService';

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
      const response = await apiClient.get('/v1/Dashboard/Summary');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  }
};

export default dashboardService; 