// src/services/customerService.js

import api from './apiService'; // Axios instance'ını import ediyoruz

/**
 * Müşterileri sayfalı olarak getirir.
 * @param {number} pageNumber - İstenen sayfa numarası (varsayılan: 1)
 * @param {number} pageSize - Sayfa başına müşteri sayısı (varsayılan: 10)
 * @returns {Promise<object>} Sayfalama bilgisi ve müşteri listesini içeren obje ({ data: [], totalCount: number, ... })
 */
export const getAllCustomers = async (pageNumber = 1, pageSize = 10) => {
  try {
    // API endpoint'i: GET /api/v1/Customer
    // Path'e /v1/ eklendi
    const response = await api.get('/v1/Customer', { // DÜZELTME: /v1/ eklendi
      params: {
        pageNumber,
        pageSize,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all customers:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Müşteriler getirilirken bir hata oluştu.');
  }
};

/**
 * Belirli bir müşterinin detaylarını getirir.
 * @param {number|string} customerId - Detayları istenen müşterinin ID'si
 * @returns {Promise<object>} Müşteri detaylarını içeren obje
 */
export const getCustomerById = async (customerId) => {
  if (!customerId) {
    throw new Error('Müşteri ID\'si belirtilmelidir.');
  }
  try {
    // API endpoint'i: GET /api/v1/Customer/{id}
    // Path'e /v1/ eklendi
    const response = await api.get(`/v1/Customer/${customerId}`); // DÜZELTME: /v1/ eklendi
    return response.data;
  } catch (error) {
    console.error(`Error fetching customer with ID ${customerId}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || `Müşteri ${customerId} getirilirken bir hata oluştu.`);
  }
};

/**
 * Yeni bir müşteri oluşturur.
 * @param {object} customerData - Yeni müşteri bilgileri
 * @returns {Promise<object>} Oluşturulan müşterinin bilgilerini içeren obje
 */
export const createCustomer = async (customerData) => {
  try {
    // API endpoint'i: POST /api/v1/Customer
    // Path'e /v1/ eklendi
    const response = await api.post('/v1/Customer', customerData); // DÜZELTME: /v1/ eklendi
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Müşteri oluşturulurken bir hata oluştu.');
  }
};

/**
 * Mevcut bir müşteriyi günceller.
 * @param {number|string} customerId - Güncellenecek müşterinin ID'si
 * @param {object} customerData - Güncellenmiş müşteri bilgileri
 * @returns {Promise<object>} Güncellenen müşterinin bilgilerini içeren obje (veya başarı mesajı)
 */
export const updateCustomer = async (customerId, customerData) => {
  if (!customerId) {
    throw new Error('Güncellenecek müşteri ID\'si belirtilmelidir.');
  }
  try {
    // API endpoint'i: PUT /api/v1/Customer/{id}
    // Path'e /v1/ eklendi
    const response = await api.put(`/v1/Customer/${customerId}`, customerData); // DÜZELTME: /v1/ eklendi
    return response.data;
  } catch (error) {
    console.error(`Error updating customer ${customerId}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || `Müşteri ${customerId} güncellenirken bir hata oluştu.`);
  }
};

/**
 * Belirli bir müşteriyi siler.
 * @param {number|string} customerId - Silinecek müşterinin ID'si
 * @returns {Promise<any>} Başarı durumunu belirten yanıt (API'ye göre değişir)
 */
export const deleteCustomer = async (customerId) => {
  if (!customerId) {
    throw new Error('Silinecek müşteri ID\'si belirtilmelidir.');
  }
  try {
    // API endpoint'i: DELETE /api/v1/Customer/{id}
    // Path'e /v1/ eklendi
    const response = await api.delete(`/v1/Customer/${customerId}`); // DÜZELTME: /v1/ eklendi
    return response.data;
  } catch (error) {
    console.error(`Error deleting customer ${customerId}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || `Müşteri ${customerId} silinirken bir hata oluştu.`);
  }
};

// Tüm fonksiyonları export ediyoruz (Önceki export şeklinize göre değiştirebilirsiniz)
export default {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};