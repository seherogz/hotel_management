import apiClient from './apiService';

// Room service
const roomService = {
  // Get all rooms
  /**
   * Odaları getirir. Opsiyonel olarak filtre parametreleri alabilir.
   * @param {object} params - API'ye gönderilecek query parametreleri (örn: { AvailabilityStartDate, AvailabilityEndDate })
   * @returns {Promise<object>} - API yanıtı
   */
  getAllRooms: async (params = {}) => {
    try {
      console.log("API'ye /v1/Room için gönderilen params:", params); // Kontrol logu
      // Her zaman /v1/Room endpoint'ine istek at, parametre varsa ekle
      const response = await apiClient.get('/v1/Room', { params });
      // API yanıt yapısına göre .data gerekebilir
      return response.data;
    } catch (error) {
      console.error('Odalar getirilirken hata:', error.response?.data || error.message);
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
  
  // Create a new room
  createRoom: async (roomData) => {
    try {
      console.log('API isteği: /v1/Room (POST)', roomData);
      // API'nin beklediği değişken isimlerini kullan
      const roomPayload = {
        ...roomData,
        // capacity -> roomCapacity api dönüşümü zaten form tarafında yapılıyor
      };
      
      const response = await apiClient.post('/v1/Room', roomPayload);
      return response.data;
    } catch (error) {
      console.error('Oda oluşturulurken hata:', error.response?.data || error.message);
      throw error.response?.data || new Error('Oda oluşturulurken bir API hatası oluştu.');
    }
  },
  
  // Update room details
  updateRoom: async (id, roomData) => {
    try {
      console.log(`API isteği: /v1/Room/${id} (PUT)`, roomData);
      // API'nin beklediği değişken isimlerini kullan
      const roomPayload = {
        ...roomData,
        id: id, // API'ye id değerini ekle
        // capacity -> roomCapacity api dönüşümü zaten form tarafında yapılıyor
      };
      
      const response = await apiClient.put(`/v1/Room/${id}`, roomPayload);
      return response.data;
    } catch (error) {
      console.error(`Oda (ID: ${id}) güncellenirken hata:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Oda güncellenirken bir API hatası oluştu.');
    }
  },
  
  // Delete a room
  deleteRoom: async (id) => {
    try {
      console.log(`API isteği: /v1/Room/${id} (DELETE)`);
      const response = await apiClient.delete(`/v1/Room/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Oda (ID: ${id}) silinirken hata:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Oda silinirken bir API hatası oluştu.');
    }
  },
  
  // Add amenities to a room
  addRoomAmenities: async (roomId, amenities) => {
    try {
      console.log(`API isteği: /v1/Room/${roomId}/amenities (POST)`, amenities);
      const response = await apiClient.post(`/v1/Room/${roomId}/amenities`, amenities);
      return response.data;
    } catch (error) {
      console.error(`Oda (ID: ${roomId}) özelliklerini eklerken hata:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Oda özellikleri eklenirken bir API hatası oluştu.');
    }
  },
  
  // Add maintenance issue to a room
  addMaintenanceIssue: async (roomId, issueData) => {
    try {
      console.log(`API isteği: /v1/Room/${roomId}/maintenance-issues (POST)`, issueData);
      const response = await apiClient.post(`/v1/Room/${roomId}/maintenance-issues`, issueData);
      return response.data;
    } catch (error) {
      console.error(`Oda (ID: ${roomId}) bakım sorunu eklenirken hata:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Bakım sorunu eklenirken bir API hatası oluştu.');
    }
  },
  
  // Resolve maintenance issue
  resolveMaintenanceIssue: async (roomId, issueId) => {
    try {
      console.log(`API isteği: /v1/Room/${roomId}/maintenance-issues/${issueId}/resolve (POST)`);
      const response = await apiClient.post(`/v1/Room/${roomId}/maintenance-issues/${issueId}/resolve`);
      return response.data;
    } catch (error) {
      console.error(`Bakım sorunu (ID: ${issueId}) çözülürken hata:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Bakım sorunu çözülürken bir API hatası oluştu.');
    }
  },
  
/**
   * Belirtilen tarih aralığı için takvim görünümü verisini getirir.
   * @param {object} params - API'ye gönderilecek query parametreleri ({ StartDate, EndDate })
   * @returns {Promise<Array>} - Her oda için günlük durumları içeren dizi [{ roomId, roomNumber, dailyStatuses: [{ date, status, ... }] }]
   */
  getCalendarViewData: async (params) => { // Parametreler: { StartDate, EndDate }
    if (!params.StartDate || !params.EndDate) {
      return Promise.reject(new Error('Takvim verisi için başlangıç ve bitiş tarihleri gereklidir.'));
    }
    try {
      console.log("API İsteği: /v1/Room/CalendarView / Parametreler:", params);
      // Yeni endpoint'e GET isteği at
      const response = await apiClient.get('/v1/Room/CalendarView', { params });
      // API yanıtının doğrudan { data: [...] } formatında geldiğini varsayıyoruz
      // veya direkt [...] dizisi dönüyorsa ona göre ayarla
      return response.data;
    } catch (error) {
      console.error('Takvim verisi getirilirken hata:', error.response?.data || error.message);
      throw error.response?.data || new Error('Takvim verisi getirilirken bir hata oluştu.');
    }
  },
  
  /**
   * Mevcut bir rezervasyonu iptal eder (POST metodu ile, boş body).
   * @param {number | string} reservationId - İptal edilecek rezervasyonun ID'si.
   * @returns {Promise<any>} - API yanıtı (Başarılıysa genellikle boş veya onay mesajı)
   */
  cancelReservation: async (reservationId) => { // Sadece ID alıyor
    if (!reservationId) {
      return Promise.reject(new Error('Rezervasyon iptali için reservationId gereklidir.'));
    }
    try {
      // Dinamik olarak doğru endpoint'i oluştur
      const url = `/v1/Reservation/${reservationId}/cancel`;
      console.log(`API'ye gönderilen POST isteği: ${url} (Body: Boş)`); // Kontrol logu

      // POST isteği gönder. Curl'deki -d '' boş body anlamına gelir.
      // axios (veya benzeri) için data parametresine null veya undefined vermek genellikle boş body gönderir.
      const response = await apiClient.post(url, null); // <-- Metod POST, Body için null gönderildi

      // Yanıt kontrolü (204 No Content durumu için)
      if (response && response.data) {
        // Eğer backend yine de bir veri döndürüyorsa onu kullan
        return response.data;
      } else {
        // Başarılı ama içerik yoksa (204) veya response.data tanımsızsa
        console.log(`Rezervasyon (ID: ${reservationId}) iptali başarılı (POST), API yanıt gövdesi boş.`);
        return true; // Başarıyı belirtmek için true döndür
      }
    } catch (error) {
      console.error(`Rezervasyon (ID: ${reservationId}) iptal edilirken hata:`, error.response?.data || error.message);
      // Hata objesini veya okunabilir bir mesajı fırlat
      throw error.response?.data || new Error('Rezervasyon iptali sırasında bir hata oluştu.');
    }
  },

  // Create a new reservation
  reserveRoom: async (reservationPayload) => {
    try {
      console.log('API isteği: /v1/Reservation (POST)', reservationPayload); // Kontrol logu
      const response = await apiClient.post('/v1/Reservation', reservationPayload);
      return response.data; // API'den dönen yanıtı döndür
    } catch (error) {
      console.error('Rezervasyon oluşturulurken hata:', error.response?.data || error.message);
      // Hata objesini veya okunabilir bir mesajı fırlat
      throw error.response?.data || new Error('Rezervasyon oluşturulurken bir API hatası oluştu.');
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