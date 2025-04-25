// src/services/customerService.js
import apiClient from './apiService'; // apiService import edildiğinden emin olun

const customerService = {

  /**
   * Tüm müşterileri API'den çeker (Rezervasyon formundaki dropdown için).
   * DİKKAT: Çok sayıda müşteri varsa ve API sayfalama yapıyorsa,
   * tüm sayfaları çekecek bir mantık eklenmeli veya backend'de
   * daha verimli bir endpoint (örn: arama/autocomplete) kullanılmalıdır.
   * @returns {Promise<Array>} Müşteri nesneleri dizisi döner. Hata durumunda boş dizi veya hata fırlatır.
   */
  getAllCustomers: async () => {
    try {
      console.log("Tüm müşteriler çekiliyor (Rezervasyon Formu için)...");
      // API endpoint'inin doğru olduğundan emin olun (örn: /v1/Customer)
      const response = await apiClient.get(`/v1/Customer`);
      console.log("getAllCustomers API yanıtı:", response.data);

      // --- API Yanıt Yapısı Kontrolü ---
      // API'nizin döndürdüğü gerçek yapıya göre bu kısmı uyarlayın.
      let customerList = [];
      if (response.data && Array.isArray(response.data.data)) {
         // Örnek Yanıt Yapısı 1: { pageNumber:..., totalCount:..., data: [...] }
         customerList = response.data.data;
         if (response.data.totalCount && response.data.data.length < response.data.totalCount) {
            console.warn("getAllCustomers: API yanıtı sayfalı! Sadece ilk sayfa işleniyor.");
            // !!! BURADA TÜM SAYFALARI ÇEKME MANTIĞI GEREKEBİLİR !!!
         }
      } else if (Array.isArray(response.data)) {
         // Örnek Yanıt Yapısı 2: Doğrudan [...] (Müşteri dizisi)
         customerList = response.data;
      } else {
          // Beklenmedik Yanıt Yapısı
          console.error("getAllCustomers: API'den beklenmedik müşteri listesi formatı:", response.data);
          // Hata fırlatmak yerine boş liste döndürmek daha güvenli olabilir:
          // return [];
          throw new Error("Müşteri listesi alınamadı veya formatı geçersiz.");
      }
      // --- --------------------------- ---

      // API'den null veya tanımsız kayıtlar geliyorsa filtrele (isteğe bağlı)
      customerList = customerList.filter(customer => customer != null);

      console.log(`getAllCustomers: ${customerList.length} müşteri başarıyla alındı.`);
      return customerList;

    } catch (error) {
      console.error(`getAllCustomers: Tüm müşteriler alınırken hata:`, error.response?.data || error.message);
      // Hata durumunda çağıran yere (örn: ReservationForm) bilgi vermek için hata fırlat
      throw new Error(error.response?.data?.message || `Müşteriler alınırken bir hata oluştu: ${error.message}`);
    }
  },

  /**
   * [DEPRECATED or FOR SPECIFIC USE]
   * Verilen kimlik numarasına sahip müşteriyi frontend'de arayarak bulur.
   * /v1/Customer endpoint'inden TÜM müşterileri çeker.
   * DİKKAT: Performans sorunları nedeniyle önerilmez. getAllCustomers ve
   * ReservationForm'daki ad/soyad seçimi tercih edilir.
   * @param {string} idNumber - Aranacak müşterinin kimlik numarası.
   * @returns {Promise<object|null>} Müşteri nesnesi veya bulunamazsa null döner.
   */
  getCustomerByIdNumber: async (idNumber) => {
    // Kimlik numarası geçerliliği kontrolü
    if (!idNumber || typeof idNumber !== 'string' || idNumber.trim() === '') {
       console.warn("getCustomerByIdNumber: Geçersiz veya boş kimlik numarası.");
       return null;
    }
    const trimmedIdNumber = idNumber.trim();

    try {
      // Bu fonksiyon da tüm müşterileri çeker, verimsizdir.
      console.warn("getCustomerByIdNumber: Tüm müşteriler tekrar çekiliyor (Verimsiz!).");
      const customerList = await customerService.getAllCustomers(); // Yeniden kullanılabilirlik için diğer fonksiyonu çağır

      // --- Kimlik Numarası Alan Adı ---
      // API yanıtınızdaki kimlik numarası alan adını buraya yazın!
      const identityField = 'identityNumber'; // <<<--- KESİNLİKLE KONTROL EDİN VE GÜNCELLEYİN!
      // --- ------------------------ ---

      console.log(`getCustomerByIdNumber: ${customerList.length} müşteri içinde ${identityField} alanı ile ${trimmedIdNumber} aranıyor...`);

      const foundCustomer = customerList.find(customer => {
          if (!customer) return false; // Null müşteri kaydını atla
          const customerIdValue = customer[identityField];
          // console.log(`Comparing: API ('${customerIdValue}') === Form ('${trimmedIdNumber}')`); // Debug
          return customerIdValue !== undefined && customerIdValue !== null &&
                 String(customerIdValue).trim() === trimmedIdNumber;
      });

      console.log(`getCustomerByIdNumber: Kimlik No ${trimmedIdNumber} için bulunan müşteri:`, foundCustomer);
      return foundCustomer || null;

    } catch (error) {
      // getAllCustomers zaten hatayı loglayıp fırlattığı için burada tekrar loglamaya gerek yok,
      // sadece hatayı tekrar fırlatabiliriz veya null dönebiliriz.
      console.error(`getCustomerByIdNumber: Müşteri aranırken hata oluştu (ID: ${trimmedIdNumber}).`, error.message);
      // Hata detayını çağıran yere iletmek için fırlatmak daha iyi olabilir:
      throw error;
      // return null; // Alternatif: Hata durumunda null dön
    }
  },

  // İleride eklenebilecek diğer fonksiyonlar (örn: createCustomer)
  // createCustomer: async (customerData) => { ... }

};

export default customerService;