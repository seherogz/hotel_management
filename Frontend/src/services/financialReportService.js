import axios from 'axios';

const BASE_URL = 'http://localhost:5002/api/v1';

// API isteklerini yapılandırma
const getAuthToken = () => {
  return localStorage.getItem('token'); // Token yerel depolamadan alınıyor
};

const createAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getMonthlyFinancialData = async (year) => {
  try {
    const headers = createAuthHeader();
    const response = await axios.get(`${BASE_URL}/FinancialReport/calculated-monthly-details?year=${year}`, {
      headers
    });
    return response.data;
  } catch (error) {
    console.error('Finansal veri çekilirken hata oluştu:', error);
    throw error;
  }
};

export const getYearlySummary = (monthlyData) => {
  if (!monthlyData || monthlyData.length === 0) {
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      netProfitPercentage: 0
    };
  }

  // Filtrele: Sadece gelir veya gideri olan ayları al
  const validMonths = monthlyData.filter(month => month.revenue > 0 || month.expenses > 0);
  
  const totalRevenue = validMonths.reduce((sum, month) => sum + month.revenue, 0);
  const totalExpenses = validMonths.reduce((sum, month) => sum + month.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  const netProfitPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    netProfitPercentage: parseFloat(netProfitPercentage.toFixed(2))
  };
}; 