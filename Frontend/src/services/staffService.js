// src/services/staffService.js
import apiService from './apiService'; // Axios instance'ımızı import ediyoruz

const BASE_URL = '/v1/Staff'; // Personel endpoint'leri için temel URL (versiyon 'v1' olarak sabitlendi)

/**
 * Personel listesini sayfalanmış olarak getirir.
 * API yanıtı: { pageNumber, pageSize, totalCount, data: [...] }
 * @param {number} pageNumber - İstenen sayfa numarası (varsayılan: 1).
 * @param {number} pageSize - Sayfa başına personel sayısı (varsayılan: 10).
 * @param {object} filters - Filtre parametreleri (örn: { department: 'Ön Büro', status: 'Aktif' }).
 * API'nin bu filtreleri query parametresi olarak desteklediğini varsayıyoruz.
 * @returns {Promise<object>} Sayfalanmış sonuç objesi.
 */
export const getAllStaff = async (pageNumber = 1, pageSize = 10, filters = {}) => {
    try {
        // Sayfalama ve filtre parametrelerini birleştir
        const params = {
            pageNumber,
            pageSize,
            ...filters // Filtre objesini query parametrelerine ekle
        };
        const response = await apiService.get(BASE_URL, { params });
        return response.data; // API'den dönen tüm yanıtı ({ data, totalCount, ... }) döndür
    } catch (error) {
        console.error("Tüm personel getirilirken hata:", error.response || error.message || error);
        throw error; // Hatayı tekrar fırlat
    }
};

/**
 * ID ile tek bir personelin detaylı bilgisini getirir.
 * Yanıt maaş ve vardiya bilgilerini de içerir.
 * @param {number} id - Personelin ID'si.
 * @returns {Promise<object>} Personel detay objesi.
 */
export const getStaffById = async (id) => {
    if (!id || id <= 0) throw new Error("getStaffById için geçerli bir Personel ID'si gereklidir");
    try {
        const response = await apiService.get(`${BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`ID'si ${id} olan personel getirilirken hata:`, error.response || error.message || error);
        throw error;
    }
};

/**
 * Yeni bir personel oluşturur.
 * ÖNEMLİ: Frontend'deki form verilerinin (örn: tek 'name' alanı, string 'status', 'position')
 * backend'in beklediği formata ('firstName', 'lastName', boolean 'isActive', 'role') dönüştürülmesi gerekir.
 * Bu dönüşüm işlemi bu servisi çağıran bileşende (örn: ManageStaff) yapılmalıdır.
 * @param {object} staffData - Backend'in POST için beklediği formatta personel verisi.
 * Örn: { firstName, lastName, department, role, startDate, email, phoneNumber, salary, isActive }
 * @returns {Promise<object>} Oluşturulan personelin verisi (genellikle ID ile birlikte).
 */
export const createStaff = async (staffData) => {
    if (!staffData) throw new Error("Personel oluşturmak için personel verisi gereklidir");
    // Frontend -> Backend format dönüşümü çağıran yerde yapılmalı!
    try {
        const response = await apiService.post(BASE_URL, staffData);
        return response.data;
    } catch (error) {
        console.error("Personel oluşturulurken hata:", error.response || error.message || error);
        throw error;
    }
};

/**
 * Mevcut bir personeli günceller.
 * ÖNEMLİ: Frontend verilerinin backend formatına dönüşümü createStaff'taki gibi gereklidir.
 * @param {number} id - Güncellenecek personelin ID'si.
 * @param {object} staffData - Backend'in PUT için beklediği formatta güncel personel verisi.
 * Örn: { id, firstName, lastName, department, role, startDate, email, phoneNumber, salary, isActive }
 * @returns {Promise<object>} API yanıtı (genellikle güncellenmiş obje veya başarı durumu).
 */
export const updateStaff = async (id, staffData) => {
    if (!id || id <= 0 || !staffData) throw new Error("Personel güncellemek için ID ve personel verisi gereklidir");
    // Frontend -> Backend format dönüşümü çağıran yerde yapılmalı!
    try {
        const response = await apiService.put(`${BASE_URL}/${id}`, staffData);
        return response.data;
    } catch (error) {
        console.error(`ID'si ${id} olan personel güncellenirken hata:`, error.response || error.message || error);
        throw error;
    }
};

/**
 * ID ile bir personeli siler.
 * @param {number} id - Silinecek personelin ID'si.
 * @returns {Promise<any>} API yanıtı (genellikle null veya sadece başarı durumu).
 */
export const deleteStaff = async (id) => {
    if (!id || id <= 0) throw new Error("Personel silmek için geçerli bir Personel ID'si gereklidir");
    try {
        const response = await apiService.delete(`${BASE_URL}/${id}`);
        // Backend 204 No Content dönerse response.data olmayabilir.
        return response.status === 204 ? null : response.data;
    } catch (error) {
        console.error(`ID'si ${id} olan personel silinirken hata:`, error.response || error.message || error);
        throw error;
    }
};

/**
 * Belirli bir personelin vardiyalarını getirir.
 * @param {number} staffId - Personelin ID'si.
 * @returns {Promise<Array<object>>} Vardiya objeleri dizisi.
 * Örn Vardiya: { id, dayOfTheWeek, shiftType, startTime, endTime, shiftDate }
 */
export const getStaffShifts = async (staffId) => {
    if (!staffId || staffId <= 0) throw new Error("getStaffShifts için geçerli bir Personel ID'si gereklidir");
    try {
        const response = await apiService.get(`${BASE_URL}/${staffId}/shifts`);
        return response.data;
    } catch (error) {
        console.error(`ID'si ${staffId} olan personelin vardiyaları getirilirken hata:`, error.response || error.message || error);
        throw error;
    }
};

/**
 * Belirli bir personelin vardiyalarını günceller/ayaralar.
 * Backend'in POST /shifts endpoint'inin tam olarak ne yaptığını (ekleme mi, tümünü değiştirme mi?) ve
 * saat formatı ('ticks' mi 'HH:mm' mi?) gibi detayları teyit etmek önemlidir.
 * Bu kod, backend'in "HH:mm" formatını kabul ettiğini ve gönderilen dizinin tüm haftayı güncellediğini varsayar.
 * @param {number} staffId - Personelin ID'si.
 * @param {Array<object>} shiftsData - Backend'in beklediği formatta vardiya objeleri dizisi.
 * Örn Gönderilecek Vardiya: { dayOfTheWeek:"Monday", startTime:"08:00", endTime:"16:00", shiftType?, shiftDate? }
 * @returns {Promise<any>} API yanıtı.
 */
export const updateStaffShifts = async (staffId, shiftsData) => {
    if (!staffId || staffId <= 0 || !shiftsData) throw new Error("Vardiya güncellemek için Personel ID'si ve vardiya verisi gereklidir");
    // Frontend vardiya formatı (örn: Pazartesi) -> Backend formatı (örn: Monday) dönüşümü çağıran yerde yapılmalı!
    // Saat formatı 'ticks' ise dönüşüm burada veya çağıran yerde yapılmalı!
    try {
        // API tanımında POST olarak belirtilmiş
        const response = await apiService.post(`${BASE_URL}/${staffId}/shifts`, shiftsData);
        return response.data;
    } catch (error) {
        console.error(`ID'si ${staffId} olan personelin vardiyaları güncellenirken hata:`, error.response || error.message || error);
        throw error;
    }
};

// İsteğe bağlı olarak tüm fonksiyonları tek bir obje olarak export edebilirsiniz:
const staffService = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffShifts,
  updateStaffShifts
};
export default staffService;