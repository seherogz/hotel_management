import React from 'react';
// Gerekli ikonları import et (önceki adımdan)
import {
  FaTv, FaWineGlassAlt, FaWifi, FaInfoCircle, FaCalendarCheck,
  FaSnowflake, FaHotTub, FaDoorOpen, FaCoffee, FaTools, FaCalendarTimes
} from 'react-icons/fa';
import styles from './RoomStatus.module.css';

// Tarihleri daha okunabilir bir formata çevirmek için yardımcı fonksiyon
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (error) {
    console.error("Tarih formatlama hatası:", error);
    return dateString;
  }
};
const formatMaintenanceDate = (dateString) => {
  if (!dateString) return 'Belirtilmemiş';
  try {
      // Örneğin: 3 Mayıs 2025, 20:49
      return new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (error) {
      console.error("Bakım tarihi formatlama hatası:", error);
      return formatDate(dateString); // Hata olursa sadece tarihi göster
  }
};

const RoomCard = ({ room, onReserve, onViewDetails }) => {

  // Durum sınıfını API yanıtındaki `computedStatus` alanına göre alır
  const getStatusClass = () => {
    switch (room.computedStatus) {
      case 'Available':
        return styles.available;
      case 'Occupied':
        return styles.occupied;
      case 'Maintenance':
        return styles.maintenance;
      default:
        return styles.available;
    }
  };

  return (
    <div className={styles.roomCard}>
      <div className={`${styles.roomHeader} ${getStatusClass()}`}>
        <div className={styles.roomNumber}>{room.roomNumber}</div>
        <div className={styles.roomCapacity}>{room.capacity} kişi</div>
      </div>

      <div className={styles.roomContent}>
        {/* Oda Özellikleri */}
        <div className={styles.roomFeatures}>
           {/* ... ikonlar ... */}
           {room.features?.includes('TV') && (<div className={styles.featureItem}><FaTv className={styles.featureIcon} /> TV</div>)}
           {room.features?.includes('Minibar') && (<div className={styles.featureItem}><FaWineGlassAlt className={styles.featureIcon} /> Minibar</div>)}
           {room.features?.includes('Wi-Fi') && (<div className={styles.featureItem}><FaWifi className={styles.featureIcon} /> Wi-Fi</div>)}
           {room.features?.includes('Air Conditioning') && (<div className={styles.featureItem}><FaSnowflake className={styles.featureIcon} /> Klima</div>)}
           {room.features?.includes('Jacuzzi') && (<div className={styles.featureItem}><FaHotTub className={styles.featureIcon} /> Jakuzi</div>)}
           {room.features?.includes('Balcony') && (<div className={styles.featureItem}><FaDoorOpen className={styles.featureIcon} /> Balkon</div>)}
           {room.features?.includes('Coffee Machine') && (<div className={styles.featureItem}><FaCoffee className={styles.featureIcon} /> Kahve Mak.</div>)}
        </div>

        {/* Fiyat */}
        <div className={styles.roomPrice}>
          Gecelik Fiyat: ₺{room.pricePerNight}
        </div>

        {/* --- DURUMA GÖRE GÖSTERİLEN BİLGİLER --- */}

        {/* Eğer oda 'Available' ise Açıklamayı göster */}
        {room.computedStatus === 'Available' && room.description && (
          <div className={styles.descriptionInfo}> {/* CSS için yeni sınıf */}
            <p>{room.description}</p>
          </div>
        )}

        {/* Eğer oda 'Occupied' ise Misafir Bilgilerini göster */}
        {room.computedStatus === 'Occupied' && room.occupantName && (
          <div className={styles.guestInfo}>
            <div className={styles.guestName}>
              Misafir: {room.occupantName}
            </div>
            <div className={styles.dateRange}>
              Giriş/Çıkış: {formatDate(room.occupantCheckInDate)} - {formatDate(room.occupantCheckOutDate)}
            </div>
          </div>
        )}

        {/* Eğer oda 'Maintenance' ise Bakım Bilgisini göster */}
        {room.computedStatus === 'Maintenance' && (
           <div className={`${styles.maintenanceInfo} ${styles.maintenanceDetails}`}>
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
        {/* --- DURUMA GÖRE GÖSTERİLEN BİLGİLER SONU --- */}


        {/* Butonlar */}
        <div className={styles.cardButtons}>
          <button
            className={styles.detailsButton}
            onClick={() => onViewDetails(room)}
          >
            <FaInfoCircle className={styles.buttonIcon} /> DETAYLAR
          </button>

          {/* Rezervasyon butonu sadece 'Available' durumunda görünür */}
          {room.computedStatus === 'Available' && (
            <button
              className={styles.reserveButton}
              onClick={() => onReserve(room)}
            >
              <FaCalendarCheck className={styles.buttonIcon} /> REZERVE ET
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;