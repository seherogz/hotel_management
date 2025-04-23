// src/services/customerService.js
import apiClient from './apiService'; // apiService'i import ettiğinden emin ol

const customerService = {
  /**
   * Verilen kimlik numarasına sahip müşteriyi frontend'de arayarak bulur.
   * /v1/Customer endpoint'inden TÜM müşterileri çeker (Sayfalama olmadığı varsayılır).
   * DİKKAT: Bu yöntem çok sayıda müşteri olduğunda yavaş olabilir!
   * @param {string} idNumber - Aranacak müşterinin kimlik numarası.
   * @returns {Promise<object|null>} Müşteri nesnesi veya bulunamazsa null döner.
   */
  getCustomerByIdNumber: async (idNumber) => {
    // Kimlik numarası geçerli değilse veya boşsa arama yapma
    if (!idNumber || typeof idNumber !== 'string' || idNumber.trim() === '') {
       console.warn("Geçersiz veya boş kimlik numarasıyla arama yapılamaz.");
       return null;
    }

    const trimmedIdNumber = idNumber.trim(); // Boşlukları temizle

    try {
      // 1. Tüm müşterileri çek (/v1/Customer endpoint'i - Sürümü (v1 vb.) kontrol et)
      console.log("Geçici çözüm: Tüm müşteriler çekiliyor (performans sorunları olabilir)...");
      const response = await apiClient.get(`/v1/Customer`); // Sürüm numarasını API'ne göre ayarla (örn: /v1/Customer)
      console.log("Müşteri listesi API yanıtı:", response.data);

      // 2. API yanıtının yapısını kontrol et ve müşteri listesini al
      let customerList = [];
      if (response.data && Array.isArray(response.data.data)) {
         // Eğer yanıt { pageNumber:..., data: [...] } şeklindeyse
         customerList = response.data.data;
         // !!! EĞER SAYFALAMA VARSA BURADA TÜM SAYFALARI ÇEKME MANTIĞI GEREKİR !!!
         if (response.data.totalCount && response.data.data.length < response.data.totalCount) {
            console.warn("API yanıtı sayfalı! Sadece ilk sayfa işleniyor. Tüm müşteriler kontrol edilmiyor olabilir.");
            // Burada tüm sayfaları almak için ek API çağrıları yapılmalı (daha karmaşık)
         }
      } else if (Array.isArray(response.data)) {
         // Eğer yanıt doğrudan [...] şeklindeyse
         customerList = response.data;
      } else {
          console.error("API'den beklenmedik müşteri listesi formatı:", response.data);
          throw new Error("Müşteri listesi alınamadı veya formatı geçersiz.");
      }

      console.log(`Toplam ${customerList.length} müşteri verisi üzerinde arama yapılıyor...`);

      // 3. Listede kimlik numarasını ara
      // !!! 'customer.identityNumber' kısmını KENDİ API YANITINDAKİ DOĞRU ALAN ADIYLA DEĞİŞTİR !!!
      // API'nin döndürdüğü müşteri nesnesinde kimlik numarasının hangi alanda olduğuna bakmalısın.
      // Örnekler: customer.identityNumber, customer.tcKimlikNo, customer.nationalId, customer.tckn vb.
      const identityField = 'identityNumber'; // <<< --- BURAYI KENDİ API'NE GÖRE DEĞİŞTİR ---
      // ---------------------------------------------------------------------------------

      const foundCustomer = customerList.find(customer =>
          customer && // Müşteri nesnesi null değilse
          customer[identityField] && // Kimlik numarası alanı var mı?
          String(customer[identityField]).trim() === trimmedIdNumber // Değerler eşleşiyor mu?
      );

      console.log(`Kimlik No ${trimmedIdNumber} için bulunan müşteri:`, foundCustomer);

      // 4. Bulunan müşteriyi veya null döndür
      return foundCustomer || null;

    } catch (error) {
      console.error(`Kimlik No ${trimmedIdNumber} ile müşteri aranırken genel hata:`, error.response?.data || error.message);
      // Hatanın detayını fırlatmak, çağıran fonksiyonda (handleCreateReservation) daha iyi hata yönetimi sağlar.
      throw new Error(error.response?.data?.message || `Müşteri aranırken bir hata oluştu: ${error.message}`);
    }
  },

  // İleride gerekirse diğer müşteri API fonksiyonları buraya eklenebilir
  // Örnek: Yeni müşteri oluşturma
  // createCustomer: async (customerData) => {
  //   try {
  //     const response = await apiClient.post('/v1/Customer', customerData);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Müşteri oluşturulurken hata:', error.response?.data || error.message);
  //     throw new Error(error.response?.data?.message || 'Müşteri oluşturulamadı.');
  //   }
  // },
};

export default customerService;