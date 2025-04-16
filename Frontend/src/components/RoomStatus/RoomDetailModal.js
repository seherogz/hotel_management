import React from 'react';
import { FaTv, FaWineGlassAlt, FaWifi, FaBath, FaTimes, FaExclamationTriangle, FaCalendarCheck } from 'react-icons/fa';
import styles from './RoomDetailModal.module.css';

const RoomDetailModal = ({ room, onClose, onCancelReservation, onReserve }) => {
  if (!room) return null;

  // Determine room status - if we have a selectedDate from the calendar view, use that info
  // otherwise use the default room status
  const isOccupied = room.status === 'Occupied';
  const isUnderMaintenance = room.status === 'Under Maintenance';
  const isAvailable = room.status === 'Available';

  // Oda özellikleri için ikonları oluştur
  const getFeatureIcon = (feature) => {
    switch (feature) {
      case 'TV':
        return <FaTv />;
      case 'Minibar':
        return <FaWineGlassAlt />;
      case 'Wi-Fi':
        return <FaWifi />;
      case 'Jakuzi':
        return <FaBath />;
      default:
        return null;
    }
  };

  // Durum sınıfı
  const getStatusClass = () => {
    switch (room.status) {
      case 'Available':
        return styles.available;
      case 'Occupied':
        return styles.occupied;
      case 'Under Maintenance':
        return styles.maintenance;
      default:
        return styles.available;
    }
  };

  // Türkçe durum metni
  const getStatusText = () => {
    switch (room.status) {
      case 'Available':
        return 'Müsait';
      case 'Occupied':
        return 'Dolu';
      case 'Under Maintenance':
        return 'Bakımda';
      default:
        return 'Müsait';
    }
  };

  // Show date information if we're coming from calendar view
  const getDateInfo = () => {
    if (room.selectedDate) {
      const date = new Date(room.selectedDate);
      return date.toLocaleDateString('tr-TR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        weekday: 'long'
      });
    }
    return null;
  };

  const selectedDateInfo = getDateInfo();

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            Oda {room.roomNumber}
            {selectedDateInfo && <span className={styles.dateSubtitle}> - {selectedDateInfo}</span>}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.leftSection}>
            <div className={styles.roomInfo}>
              <div className={`${styles.statusBadge} ${getStatusClass()}`}>
                {getStatusText()}
              </div>
              <div className={styles.roomDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.label}>Kapasite:</span>
                  <span className={styles.value}>{room.capacity}</span>
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

            {isOccupied && room.guest && (
              <div className={styles.guestInfo}>
                <h3 className={styles.sectionTitle}>Misafir Bilgileri</h3>
                <div className={styles.guestDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>İsim:</span>
                    <span className={styles.value}>{room.guest.name}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Giriş Tarihi:</span>
                    <span className={styles.value}>{room.guest.checkInDate}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Çıkış Tarihi:</span>
                    <span className={styles.value}>{room.guest.checkOutDate}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Rezervasyon ID:</span>
                    <span className={styles.value}>{room.guest.reservationId || 'RES123456'}</span>
                  </div>
                </div>
                <button 
                  className={styles.cancelButton}
                  onClick={() => onCancelReservation(room)}
                >
                  <FaExclamationTriangle className={styles.buttonIcon} />
                  REZERVASYONU İPTAL ET
                </button>
              </div>
            )}

            {isAvailable && (
              <div className={styles.availableActions}>
                <button 
                  className={styles.reserveButton}
                  onClick={() => onReserve(room)}
                >
                  <FaCalendarCheck className={styles.buttonIcon} />
                  REZERVASYON OLUŞTUR
                </button>
              </div>
            )}
          </div>

          <div className={styles.rightSection}>
            <div className={styles.featuresSection}>
              <h3 className={styles.sectionTitle}>Oda Özellikleri</h3>
              <div className={styles.featuresList}>
                {room.features.map((feature, index) => (
                  <div key={index} className={styles.featureItem}>
                    <div className={styles.featureIcon}>{getFeatureIcon(feature)}</div>
                    <span className={styles.featureName}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.descriptionSection}>
              <h3 className={styles.sectionTitle}>Oda Açıklaması</h3>
              <p className={styles.descriptionText}>
                {room.description || `Bu tipindeki bu odamız, ${room.capacity.toLowerCase()} kapasitesiyle konforlu bir konaklama imkanı sunmaktadır. Modern dekorasyon ve kaliteli mobilyalar ile donatılmış odamız, tüm ihtiyaçlarınıza cevap verecek şekilde tasarlanmıştır. Oda içerisinde TV, Minibar, Wi-Fi gibi özelliklerden faydalanabilirsiniz. Ferah ve aydınlık odamız, rahat bir konaklama için gerekli tüm imkanlara sahiptir.`}
              </p>
            </div>
          </div>
        </div>

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