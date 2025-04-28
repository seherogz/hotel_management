// src/services/reservationService.js
import apiClient from './apiService'; // Mevcut apiClient'ı import ediyoruz
import { format } from 'date-fns';

const API_VERSION = 'v1'; // veya process.env.REACT_APP_API_VERSION

/**
 * Belirli bir tarih için check-in bekleyen rezervasyonları getirir.
 * ARAMA PARAMETRELERİ KALDIRILDI - Filtreleme frontend'de yapılacak.
 * @param {object} params - Parametreler objesi
 * @param {Date} params.checkInDate - Check-in tarihi (Date nesnesi)
 * @param {number} [params.pageNumber=1] - Sayfa numarası (API'nin beklediği)
 * @param {number} [params.pageSize=10] - Sayfa başına kayıt sayısı
 * @returns {Promise<object>} API yanıtı (pageNumber, pageSize, totalCount, data içerir)
 */
// searchTerm parametresi fonksiyondan kaldırıldı
export const getCheckInReservations = async ({ checkInDate, pageNumber = 1, pageSize = 10 }) => {
  try {
    const apiParams = {
      CheckInDate: format(checkInDate, 'yyyy-MM-dd'),
      PageNumber: pageNumber,
      PageSize: pageSize,
      // CustomerName ve ReservationId parametreleri kaldırıldı
    };
    const response = await apiClient.get(`/${API_VERSION}/Reservation/check-ins`, {
      params: apiParams,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching check-in reservations:', error.response?.data || error.message);
    throw error;
  }
};


/**
 * Bir rezervasyon için check-in işlemini gerçekleştirir. (Artık gerçek API'yi çağırıyor)
 * @param {number} reservationId - Check-in yapılacak rezervasyon ID'si
 * @returns {Promise<object>} API yanıtı (örn: { success: true, message: 'Check-in successful.' })
 */
export const performCheckIn = async (reservationId) => {
  console.log(`Performing actual check-in for ID: ${reservationId}`);
  try {
    // Belirtilen endpoint'e POST isteği at
    // Genellikle check-in gibi işlemler için POST veya PUT kullanılır.
    // Bu isteğin bir request body'ye ihtiyacı olup olmadığını backend belirler, şimdilik boş gönderiyoruz.
    const response = await apiClient.post(`/${API_VERSION}/Reservation/${reservationId}/check-in`);

    // Başarılı yanıtı işle
    // Backend'den dönen mesajı kullanabiliriz veya standart bir mesaj verebiliriz.
    return {
      success: true,
      message: response.data?.message || `Check-in successful for reservation ${reservationId}.`
    };
  } catch (error) {
    // Hata durumunu işle
    console.error('Error performing check-in:', error.response?.data || error.message);
    // Backend'den gelen hata mesajını fırlat, yoksa genel bir mesaj kullan
    throw new Error(error.response?.data?.message || 'Failed to perform check-in. Please try again.');
  }
};
/**
 * Belirli bir tarih için check-out yapması beklenen rezervasyonları getirir.
 * ARAMA PARAMETRESİ KALDIRILDI - Filtreleme frontend'de yapılacak.
 * @param {object} params - Parametreler objesi
 * @param {Date} params.checkOutDate - Check-out tarihi (Date nesnesi)
 * @param {number} [params.pageNumber=1] - Sayfa numarası (API'nin beklediği)
 * @param {number} [params.pageSize=10] - Sayfa başına kayıt sayısı
 * @returns {Promise<object>} API yanıtı (pageNumber, pageSize, totalCount, data içerir)
 */
// searchTerm parametresi fonksiyondan kaldırıldı
export const getCheckOutReservations = async ({ checkOutDate, pageNumber = 1, pageSize = 10 }) => {
  console.log(`Fetching ACTUAL check-out reservations for date: ${format(checkOutDate, 'yyyy-MM-dd')}, page: ${pageNumber}`);
  try {
    const apiParams = {
      CheckOutDate: format(checkOutDate, 'yyyy-MM-dd'),
      PageNumber: pageNumber,
      PageSize: pageSize,
      // SearchTerm veya CustomerName/ReservationId parametreleri kaldırıldı
    };

    console.log('API Call Params (Check-Out GET - No Search):', apiParams);

    const response = await apiClient.get(`/${API_VERSION}/Reservation/check-outs`, {
      params: apiParams,
    });

    console.log('Check-Out GET Response:', response.data);
    return response.data; // Yanıtı doğrudan döndür

  } catch (error) {
    console.error('Error fetching check-out reservations:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Bir rezervasyon için check-out işlemini gerçekleştirir.
 * @param {number} reservationId - Check-out yapılacak rezervasyon ID'si
 * @returns {Promise<object>} API yanıtı (örn: { success: true, message: 'Check-out successful.' })
 */
export const performCheckOut = async (reservationId) => {
  console.log(`Performing actual check-out for ID: ${reservationId}`);
  try {
    // Belirttiğiniz POST endpoint'ini kullan
    const response = await apiClient.post(`/${API_VERSION}/Reservation/${reservationId}/check-out`);

    console.log('Check-Out POST Response:', response.data);

    // Başarılı yanıtı işle
    return {
      success: true,
      message: response.data?.message || `Check-out successful for reservation ${reservationId}.`
    };
  } catch (error) {
    console.error('Error performing check-out:', error.response?.data || error.message);
    // Backend'den gelen hata mesajını fırlat
    throw new Error(error.response?.data?.message || 'Failed to perform check-out. Please try again.');
  }
};