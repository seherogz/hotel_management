import React from 'react';
// İkonları import et (önceki koddan - FaBath yerine FaHotTub kullandık)
import {
  FaTv, FaWineGlassAlt, FaWifi, FaTimes, FaExclamationTriangle,
  FaCalendarCheck, FaHotTub, FaSnowflake, FaDoorOpen, FaCoffee, FaInfoCircle // FaInfoCircle eklendi
} from 'react-icons/fa';
import styles from './RoomDetailModal.module.css';

// Tarihleri formatlamak için yardımcı fonksiyon (RoomCard'daki gibi)
// Eğer ayrı bir util dosyanız yoksa buraya ekleyin
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (error) {
    console.error("Tarih formatlama hatası:", error);
    return dateString;
  }
};

const RoomDetailModal = ({ room, onClose, onCancelReservation, onReserve }) => {
  if (!room) return null;

  // Durum belirleme - room.computedStatus kullanılıyor
  const roomStatus = room.computedStatus || 'Available'; // Varsayılan olarak Available

  // Özellik ikonları (Önceki düzeltmelerle güncel)
  const getFeatureIcon = (feature) => {
    switch (feature) {
      case 'TV': return <FaTv />;
      case 'Minibar': return <FaWineGlassAlt />;
      case 'Wi-Fi': return <FaWifi />;
      case 'Jacuzzi': return <FaHotTub />;
      case 'Air Conditioning': return <FaSnowflake />;
      case 'Balcony': return <FaDoorOpen />;
      case 'Coffee Machine': return <FaCoffee />;
      default: return null;
    }
  };

  // Durum sınıfı - room.computedStatus kullanılıyor
  const getStatusClass = () => {
    switch (roomStatus) { // computedStatus'a göre
      case 'Available': return styles.available;
      case 'Occupied': return styles.occupied;
      case 'Maintenance': return styles.maintenance; // API 'Maintenance' gönderiyorsa
      // case 'Under Maintenance': return styles.maintenance; // API 'Under Maintenance' gönderiyorsa
      default: return styles.available;
    }
  };

  // Türkçe durum metni - room.computedStatus kullanılıyor
  const getStatusText = () => {
    switch (roomStatus) { // computedStatus'a göre
      case 'Available': return 'Müsait';
      case 'Occupied': return 'Dolu';
      case 'Maintenance': return 'Bakımda'; // API 'Maintenance' gönderiyorsa
      // case 'Under Maintenance': return 'Bakımda'; // API 'Under Maintenance' gönderiyorsa
      default: return 'Müsait';
    }
  };

  // Takvimden gelen tarih bilgisi (Aynı kalabilir)
  const getDateInfo = () => {
    // 'selectedDate' ISO formatında geliyor olabilir, 'displayDate' GG.AA.YYYY ise onu kullan
    if (room.displayDate) {
        return room.displayDate;
    }
    if (room.selectedDate) {
      try {
        const date = new Date(room.selectedDate);
        return date.toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          weekday: 'long'
        });
      } catch (e) { return null; }
    }
    return null;
  };

  const selectedDateInfo = getDateInfo();

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* Modal Başlığı */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            Oda {room.roomNumber}
            {/* Takvimden gelindiyse tarihi göster */}
            {selectedDateInfo && <span className={styles.dateSubtitle}> - {selectedDateInfo}</span>}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className={styles.modalBody}>
          {/* Sol Bölüm */}
          <div className={styles.leftSection}>
            {/* Oda Temel Bilgileri */}
            <div className={styles.roomInfo}>
              {/* Durum etiketi - Artık computedStatus'a göre doğru çalışacak */}
              <div className={`${styles.statusBadge} ${getStatusClass()}`}>
                {getStatusText()}
              </div>
              <div className={styles.roomDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.label}>Kapasite:</span>
                  {/* Kapasiteyi X kişi formatında göster */}
                  <span className={styles.value}>{room.capacity} kişi</span>
                </div>
                {room.roomType && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Oda Tipi:</span>
                    <span className={styles.value}>{room.roomType}</span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <span className={styles.label}>Gecelik Fiyat:</span>
                  <span className={styles.value}>₺{room.pricePerNight}</span>
                </div>
              </div>
            </div>

            {/* Misafir Bilgileri - GÜNCELLENDİ */}
            {/* computedStatus'a ve occupantName'e göre kontrol et */}
            {roomStatus === 'Occupied' && room.occupantName && (
              <div className={styles.guestInfo}>
                <h3 className={styles.sectionTitle}>Misafir Bilgileri</h3>
                <div className={styles.guestDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>İsim:</span>
                    {/* Doğrudan room.occupantName kullan */}
                    <span className={styles.value}>{room.occupantName}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Giriş Tarihi:</span>
                    {/* Doğrudan room.occupantCheckInDate kullan ve formatla */}
                    <span className={styles.value}>{formatDate(room.occupantCheckInDate)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Çıkış Tarihi:</span>
                    {/* Doğrudan room.occupantCheckOutDate kullan ve formatla */}
                    <span className={styles.value}>{formatDate(room.occupantCheckOutDate)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Rezervasyon ID:</span>
                    {/* Doğrudan room.currentReservationId kullan */}
                    <span className={styles.value}>{room.currentReservationId || 'N/A'}</span>
                  </div>
                </div>
                {/* Rezervasyon İptal Butonu - GÜNCELLENDİ */}
                {/* onCancelReservation'a doğru ID'yi (currentReservationId) gönder */}
                <button
                className={styles.cancelButton} // Veya hangi sınıf adını kullanıyorsan
                 // Tıklandığında onCancelReservation prop'unu çağırır ve reservationId'yi gönderir
                onClick={() => onCancelReservation(room.currentReservationId)}
                 // Eğer rezervasyon ID yoksa veya işlem sürüyorsa butonu pasif yap
                 disabled={!room.currentReservationId} // isLoading prop'u RoomStatus'tan gönderilebilir
                >
                  <FaExclamationTriangle className={styles.buttonIcon} />
                  REZERVASYONU İPTAL ET
                </button>
              </div>
            )}

             {/* Bakım Bilgisi - GÜNCELLENDİ */}
             {roomStatus === 'Maintenance' && (
                <div className={styles.maintenanceInfoSection}> {/* Yeni stil sınıfı */}
                  <h3 className={styles.sectionTitle}>Bakım Bilgisi</h3>
                  <p>{room.description || 'Oda şu anda bakımda.'}</p> {/* Açıklama varsa göster */}
                </div>
             )}


            {/* Müsait Aksiyonları - GÜNCELLENDİ */}
            {/* computedStatus'a göre kontrol et */}
            {roomStatus === 'Available' && (
              <div className={styles.availableActions}>
                <button
                  className={styles.reserveButton}
                  onClick={() => onReserve(room)} // onReserve tüm odayı alıyor varsayımı
                >
                  <FaCalendarCheck className={styles.buttonIcon} />
                  REZERVASYON OLUŞTUR
                </button>
              </div>
            )}
          </div>

          {/* Sağ Bölüm */}
          <div className={styles.rightSection}>
            {/* Oda Özellikleri */}
            <div className={styles.featuresSection}>
              <h3 className={styles.sectionTitle}>Oda Özellikleri</h3>
              <div className={styles.featuresList}>
                {/* Özellikler map edilirken kontrol (features yoksa?) */}
                {room.features?.map((feature, index) => {
                  const icon = getFeatureIcon(feature);
                  // Sadece ikonu olan veya tüm özellikleri göster (isteğe bağlı)
                  if (icon || feature) { // İkonu olmasa bile özelliği listele
                    return (
                      <div key={index} className={styles.featureItemModal}> {/* Farklı stil sınıfı? */}
                        <div className={styles.featureIconModal}>{icon || <FaInfoCircle />}</div> {/* İkon yoksa varsayılan */}
                        <span className={styles.featureNameModal}>{feature}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Oda Açıklaması - GÜNCELLENDİ */}
            <div className={styles.descriptionSection}>
              <h3 className={styles.sectionTitle}>Oda Açıklaması</h3>
              {/* room.description alanını kullan */}
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