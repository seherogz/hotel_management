// src/components/RoomStatus/RoomDetailModal.js

import React from 'react';
// İkonları import et
import {
  FaTv, FaWineGlassAlt, FaWifi, FaTimes, FaExclamationTriangle,
  FaCalendarCheck, FaHotTub, FaSnowflake, FaDoorOpen, FaCoffee, FaInfoCircle,
  FaTools, // Bakım ikonu
  FaCalendarTimes // Bitiş tarihi ikonu
} from 'react-icons/fa';
import {
  Typography
} from '@mui/material';
import styles from './RoomDetailModal.module.css'; // İlgili CSS modülünü import et
import { format } from 'date-fns'; // format import edildiğinden emin ol
import { tr } from 'date-fns/locale'; // tr locale import edildiğinden emin ol

// Tarihleri formatlamak için yardımcı fonksiyon
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: tr }); // Sadece tarih
  } catch (error) {
    console.error("Tarih formatlama hatası:", error);
    return dateString;
  }
};

// Bakım bitiş tarihi için özel formatlama fonksiyonu
const formatMaintenanceDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    try {
        // Örneğin: 3 Mayıs 2025, 20:49
        return format(new Date(dateString), 'd MMMM yyyy', { locale: tr });
    } catch (error) {
        console.error("Bakım tarihi formatlama hatası:", error);
        // Hata olursa sadece tarihi göster (formatDate ile)
        try {
            return format(new Date(dateString), 'dd.MM.yyyy', { locale: tr });
        } catch {
             return dateString; // Yine hata olursa ham veriyi göster
        }
    }
};

const RoomDetailModal = ({ room, onClose, onCancelReservation, onReserve }) => {
  // Eğer room prop'u gelmediyse veya boşsa hiçbir şey gösterme
  if (!room) return null;

  // Durum belirleme - Gelen room objesindeki computedStatus kullanılıyor
  const roomStatus = room.computedStatus || 'Available'; // Varsayılan olarak Available

  // Özellik ikonlarını döndüren fonksiyon
  const getFeatureIcon = (feature) => {
    switch (feature) {
      case 'TV': return <FaTv />;
      case 'Minibar': return <FaWineGlassAlt />; // API Minibar gönderiyor mu kontrol et
      case 'Wi-Fi': return <FaWifi />;
      case 'Jacuzzi': return <FaHotTub />;
      case 'Air Conditioning': return <FaSnowflake />;
      case 'Balcony': return <FaDoorOpen />;
      case 'Coffee Machine': return <FaCoffee />;
      default: return null; // Bilinmeyen özellik için ikon yok
    }
  };

  // Duruma göre CSS sınıfını döndüren fonksiyon
  const getStatusClass = () => {
    switch (roomStatus) {
      case 'Available': return styles.available;
      case 'Occupied': return styles.occupied;
      case 'Maintenance': return styles.maintenance;
      default: return styles.available; // Bilinmeyen durumlar için varsayılan
    }
  };

  // Duruma göre gösterilecek Türkçe metni döndüren fonksiyon
  const getStatusText = () => {
    switch (roomStatus) {
      case 'Available': return 'Müsait';
      case 'Occupied': return 'Dolu';
      case 'Maintenance': return 'Bakımda';
      default: return 'Müsait'; // Bilinmeyen durumlar için varsayılan
    }
  };

  // Takvimden tıklandığında gelen seçili tarih bilgisini formatlayan fonksiyon
  const getDateInfo = () => {
    if (room.displayDate) { return room.displayDate; } // Önceden formatlanmış varsa kullan
    if (room.selectedDate) { // ISO string varsa formatla
      try {
        const date = new Date(room.selectedDate);
        return format(date, 'dd MMMM yyyy, EEEE', { locale: tr }); // Örn: 03 Mayıs 2025, Cumartesi
      } catch (e) { return null; }
    }
    return null; // Tarih bilgisi yoksa null döndür
  };

  const selectedDateInfo = getDateInfo(); // Seçili tarihi al

  return (
    // Modalın dışını kaplayan overlay
    <div className={styles.modalOverlay} onClick={onClose}> {/* Overlay'e tıklayınca kapat */}
      {/* Modalın ana içeriği (Tıklayınca kapanmayı engelle) */}
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

        {/* Modal Başlığı */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            Oda {room.roomNumber}
            {/* Takvimden gelindiyse seçili tarihi göster */}
            {selectedDateInfo && <span className={styles.dateSubtitle}> - {selectedDateInfo}</span>}
          </h2>
          {/* Kapatma Butonu */}
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Modal Gövdesi (İki Sütunlu) */}
        <div className={styles.modalBody}>
          {/* Sol Sütun */}
          <div className={styles.leftSection}>
            {/* Oda Temel Bilgileri */}
            <div className={styles.roomInfo}>
              {/* Durum Etiketi */}
              <div className={`${styles.statusBadge} ${getStatusClass()}`}>
                {getStatusText()}
              </div>
              {/* Diğer Detaylar */}
              <div className={styles.roomDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.label}>Kapasite:</span>
                  <span className={styles.value}>{room.capacity} kişi</span>
                </div>
                {room.roomType && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Oda Tipi:</span>
                    <span className={styles.value}>{room.roomType}</span>
                  </div>
                )}
                 {/* Gecelik Fiyat (varsa) */}
                 {room.pricePerNight !== undefined && room.pricePerNight !== null && (
                    <div className={styles.detailItem}>
                        <span className={styles.label}>Gecelik Fiyat:</span>
                        <span className={styles.value}>₺{Number(room.pricePerNight).toFixed(2)}</span>
                    </div>
                 )}
              </div>
            </div>

            {/* Misafir Bilgileri (Oda Dolu ise) */}
            {roomStatus === 'Occupied' && room.occupantName && (
              <div className={styles.guestInfo}>
                <h3 className={styles.sectionTitle}>Misafir Bilgileri</h3>
                <div className={styles.guestDetails}>
                  <div className={styles.detailItem}> <span className={styles.label}>İsim:</span> <span className={styles.value}>{room.occupantName}</span> </div>
                  <div className={styles.detailItem}> <span className={styles.label}>Giriş Tarihi:</span> <span className={styles.value}>{formatDate(room.occupantCheckInDate)}</span> </div>
                  <div className={styles.detailItem}> <span className={styles.label}>Çıkış Tarihi:</span> <span className={styles.value}>{formatDate(room.occupantCheckOutDate)}</span> </div>
                  <div className={styles.detailItem}> <span className={styles.label}>Rezervasyon ID:</span> <span className={styles.value}>{room.currentReservationId || 'N/A'}</span> </div>
                </div>
                {/* Rezervasyon İptal Butonu */}
                <button
                    className={styles.cancelButton}
                    onClick={() => onCancelReservation(room.currentReservationId)}
                    disabled={!room.currentReservationId}
                >
                  <FaExclamationTriangle className={styles.buttonIcon} /> REZERVASYONU İPTAL ET
                </button>
              </div>
            )}

             {/* Bakım Bilgisi (Oda Bakımda ise) */}
             {roomStatus === 'Maintenance' && (
                // CSS modülündeki ilgili stilleri kullan
                <div className={`${styles.maintenanceInfoSection} ${styles.maintenanceDetails}`}>
                  <h3 className={styles.sectionTitle}>Bakım Bilgisi</h3>
                   <div className={styles.maintenanceItem}>
                      <FaTools className={styles.maintenanceIcon} />
                      <span className={styles.maintenanceLabel}>Sebep:</span>
                      <span className={styles.maintenanceValue}>
                          {room.maintenanceIssueDescription || 'Genel Bakım'}
                      </span>
                   </div>
                   <div className={styles.maintenanceItem}>
                      <FaCalendarTimes className={styles.maintenanceIcon} />
                      <span className={styles.maintenanceLabel}>Tahmini Bitiş:</span>
                      <span className={styles.maintenanceValue}>
                          {formatMaintenanceDate(room.maintenanceCompletionDate)}
                      </span>
                   </div>
                </div>
             )}

            {/* Müsait Aksiyonları (Oda Müsait ise) */}
            {roomStatus === 'Available' && (
              <div className={styles.availableActions}>
                <button
                  className={styles.reserveButton}
                  onClick={() => onReserve(room)} // onReserve prop'unu çağırır
                >
                  <FaCalendarCheck className={styles.buttonIcon} /> REZERVASYON OLUŞTUR
                </button>
              </div>
            )}
          </div>

          {/* Sağ Sütun */}
          <div className={styles.rightSection}>
            {/* Oda Özellikleri */}
            <div className={styles.featuresSection}>
              <h3 className={styles.sectionTitle}>Oda Özellikleri</h3>
              <div className={styles.featuresList}>
                {/* Oda özellikleri listeleniyor */}
                {room.features && Array.isArray(room.features) && room.features.length > 0 ? (
                    room.features.map((feature, index) => {
                      const icon = getFeatureIcon(feature);
                      return (
                        // featureItem yerine featureItemModal kullanılmıştı, düzeltildi (CSS'e göre ayarla)
                        <div key={index} className={styles.featureItem}>
                          <div className={styles.featureIcon}>{icon || <FaInfoCircle />}</div>
                          {/* featureName yerine featureNameModal kullanılmıştı, düzeltildi (CSS'e göre ayarla) */}
                          <span className={styles.featureName}>{feature}</span>
                        </div>
                      );
                    })
                 ) : (
                    <Typography variant="body2" color="text.secondary">Özellik bilgisi bulunamadı.</Typography>
                 )}
              </div>
            </div>

            {/* Oda Açıklaması */}
            <div className={styles.descriptionSection}>
              <h3 className={styles.sectionTitle}>Oda Açıklaması</h3>
              <p className={styles.descriptionText}>
                {room.description || 'Bu oda için özel bir açıklama girilmemiş.'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Altbilgisi */}
        <div className={styles.modalFooter}>
          <button className={styles.closeModalButton} onClick={onClose}>
            KAPAT
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailModal;