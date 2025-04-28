import apiClient from './apiService';

/**
 * Muhasebe özet verilerini (günlük/haftalık gelir/gider) getirir.
 * @returns {Promise<object>} Özet verilerini içeren bir promise.
 */
export const getAccountingSummary = async () => {
  try {
    const response = await apiClient.get('/v1/Accounting/transactions/summary');
    // API yanıtının doğrudan veri içerdiğini varsayıyoruz
    // ({ dailyIncome: ..., weeklyIncome: ... })
    return response.data;
  } catch (error) {
    console.error('Error fetching accounting summary:', error.response?.data || error.message);
    // Hata durumunda anlamlı bir nesne veya null döndürebiliriz
    // Ya da hatayı yeniden fırlatabiliriz
    throw error; // Veya return null; ya da return {};
  }
};

/**
 * Gelir kayıtlarını sayfalama ile getirir.
 * @param {number} pageNumber - Getirilecek sayfa numarası.
 * @param {number} pageSize - Sayfa başına kayıt sayısı.
 * @returns {Promise<object>} Sayfalama bilgisi ve gelir verilerini içeren bir promise ({ data: [], totalCount: ..., ... }).
 */
export const getIncomes = async (pageNumber = 1, pageSize = 30) => {
  try {
    // API'nin query parametrelerini desteklediğini varsayıyoruz
    const response = await apiClient.get('/v1/Accounting/incomes', {
      params: { pageNumber, pageSize },
    });
    // API yanıtının { data: [], totalCount: ..., pageNumber: ..., pageSize: ... }
    // formatında olduğunu varsayıyoruz
    return response.data;
  } catch (error) {
    console.error('Error fetching incomes:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Gider kayıtlarını sayfalama ile getirir.
 * @param {number} pageNumber - Getirilecek sayfa numarası.
 * @param {number} pageSize - Sayfa başına kayıt sayısı.
 * @returns {Promise<object>} Sayfalama bilgisi ve gider verilerini içeren bir promise ({ data: [], totalCount: ..., ... }).
 */
export const getExpenses = async (pageNumber = 1, pageSize = 30) => {
  try {
    const response = await apiClient.get('/v1/Accounting/expenses', {
      params: { pageNumber, pageSize },
    });
    // API yanıtının { data: [], totalCount: ..., pageNumber: ..., pageSize: ... }
    // formatında olduğunu varsayıyoruz
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Yeni bir gelir kaydı ekler.
 * @param {object} incomeData - Eklenecek gelirin verileri ({ incomeNumber, date, customerName, roomNumber, amount }).
 * @returns {Promise<object>} API'den dönen yanıtı içeren bir promise.
 */
export const addIncome = async (incomeData) => {
    try {
      // API endpoint'ine POST isteği gönderiyoruz
      // Versiyon numarasını (v1) URL'ye eklemeyi unutmayın (eğer gerekiyorsa)
      // apiService'deki baseURL genellikle '/api/v1' içerir, bu yüzden sadece '/Accounting/incomes' yeterli olabilir.
      // Emin olmak için apiService.js'i kontrol edin veya tam yolu yazın.
      const response = await apiClient.post('/v1/Accounting/incomes', incomeData);
      return response.data; // Başarılı yanıtta dönen veriyi döndür
    } catch (error) {
      console.error('Error adding income:', error.response?.data || error.message);
      // Hata durumunda, hatayı işlemek üzere yeniden fırlatabiliriz
      // veya özel bir hata mesajı döndürebiliriz.
      throw error;
    }
  };

  /**
 * Yeni bir gider kaydı ekler.
 * @param {object} expenseData - Eklenecek giderin verileri ({ expenseNumber, date, category, description, amount }).
 * @returns {Promise<object>} API'den dönen yanıtı içeren bir promise.
 */
export const addExpense = async (expenseData) => {
    try {
      // API endpoint'ine POST isteği gönderiyoruz
      const response = await apiClient.post('/v1/Accounting/expenses', expenseData);
      return response.data; // Başarılı yanıtta dönen veriyi döndür
    } catch (error) {
      console.error('Error adding expense:', error.response?.data || error.message);
      throw error; // Hatayı yeniden fırlat
    }
  };
  /**
 * Belirtilen ID'ye sahip gelir kaydını siler.
 * @param {number|string} id - Silinecek gelirin ID'si.
 * @returns {Promise<object>} API'den dönen yanıtı içeren bir promise (genellikle boş veya onay mesajı).
 */
export const deleteIncome = async (id) => {
    try {
      // API endpoint'ine DELETE isteği gönderiyoruz
      const response = await apiClient.delete(`/v1/Accounting/incomes/${id}`);
      return response.data; // Başarılı yanıtta dönen veriyi döndür
    } catch (error) {
      console.error(`Error deleting income with ID ${id}:`, error.response?.data || error.message);
      throw error; // Hatayı yeniden fırlat
    }
  };
  
  /**
   * Belirtilen ID'ye sahip gider kaydını siler.
   * @param {number|string} id - Silinecek giderin ID'si.
   * @returns {Promise<object>} API'den dönen yanıtı içeren bir promise.
   */
  export const deleteExpense = async (id) => {
    try {
      // API endpoint'ine DELETE isteği gönderiyoruz
      const response = await apiClient.delete(`/v1/Accounting/expenses/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting expense with ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  };
 /**
 * Belirtilen ID'ye sahip gelir kaydını günceller.
 * @param {number|string} id - Güncellenecek gelirin ID'si.
 * @param {object} incomeData - Modal'dan gelen tüm form verileri.
 * @returns {Promise<object>} API'den dönen yanıtı içeren bir promise.
 */
export const updateIncome = async (id, incomeData) => {
    try {
      // API'nin beklediği body'yi oluşturalım (id dahil, incomeNumber hariç)
      const updatePayload = {
        id: Number(id), // ID'yi sayıya çevirip ekleyelim
        date: incomeData.date, // ISO formatında olmalı (modal'dan öyle gelmeli)
        customerName: incomeData.customerName,
        roomNumber: incomeData.roomNumber,
        amount: Number(incomeData.amount) // Sayıya çevirelim
      };
  
      const response = await apiClient.put(`/v1/Accounting/incomes/${id}`, updatePayload);
      return response.data;
    } catch (error) {
      console.error(`Error updating income with ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  };
  
  /**
   * Belirtilen ID'ye sahip gider kaydını günceller.
   * @param {number|string} id - Güncellenecek giderin ID'si.
   * @param {object} expenseData - Modal'dan gelen tüm form verileri.
   * @returns {Promise<object>} API'den dönen yanıtı içeren bir promise.
   */
  export const updateExpense = async (id, expenseData) => {
    try {
       // API'nin beklediği body'yi oluşturalım (id dahil, expenseNumber hariç)
       const updatePayload = {
         id: Number(id),
         date: expenseData.date, // ISO formatında olmalı
         category: expenseData.category,
         description: expenseData.description,
         amount: Number(expenseData.amount)
       };
  
      const response = await apiClient.put(`/v1/Accounting/expenses/${id}`, updatePayload);
      return response.data;
    } catch (error) {
      console.error(`Error updating expense with ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  };
// accountingService objesi olarak dışa aktarma (alternatif)
/*
const accountingService = {
  getAccountingSummary,
  getIncomes,
  getExpenses,
};
export default accountingService;
*/

// Şimdilik her fonksiyonu ayrı ayrı export edelim