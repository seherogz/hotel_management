import React from 'react';
import { FaTv, FaWineGlassAlt, FaWifi, FaInfoCircle, FaCalendarCheck } from 'react-icons/fa';
import styles from './RoomStatus.module.css';

const RoomCard = ({ room, onReserve, onViewDetails }) => {
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

  // Oda tipine veya numarasına göre varsayılan resim seç
  const getRoomImage = () => {
    // Eğer odanın kendi fotoğrafı varsa onu kullan
    if (room.imageUrl) {
      return room.imageUrl;
    }

    // Yoksa varsayılan resimler arasından seç
    // Basitleştirilmiş: oda kapasitesine göre tek veya çift kişilik resim seçme
    if (room.capacity.includes('2')) {
      return `/images/rooms/double_room.jpg`;
    } else if (room.capacity.includes('4')) {
      return `/images/rooms/quad_standard_1.jpg`;
    } else {
      return `/images/rooms/single_room.jpg`;
    }
  };

  return (
    <div className={styles.roomCard}>
      <div className={`${styles.roomHeader} ${getStatusClass()}`}>
        <div className={styles.roomNumber}>{room.roomNumber}</div>
        <div className={styles.roomCapacity}>{room.capacity}</div>
      </div>
      
      <div className={styles.roomImageContainer}>
        <img 
          src={getRoomImage()} 
          alt={`Room ${room.roomNumber}`} 
          className={styles.roomImage}
          onError={(e) => {
            // Resim yüklenemezse varsayılan resme dön
            e.target.src = '/images/rooms/default_room.jpg';
          }}
        />
      </div>

      <div className={styles.roomContent}>
        <div className={styles.roomFeatures}>
          {room.features.includes('TV') && (
            <div className={styles.featureItem}>
              <FaTv className={styles.featureIcon} /> TV
            </div>
          )}
          {room.features.includes('Minibar') && (
            <div className={styles.featureItem}>
              <FaWineGlassAlt className={styles.featureIcon} /> Minibar
            </div>
          )}
          {room.features.includes('Wi-Fi') && (
            <div className={styles.featureItem}>
              <FaWifi className={styles.featureIcon} /> Wi-Fi
            </div>
          )}
        </div>

        <div className={styles.roomPrice}>
          Gecelik Fiyat: ₺{room.pricePerNight}
        </div>

        {room.status === 'Occupied' && room.guest && (
          <div className={styles.guestInfo}>
            <div className={styles.guestName}>
              Misafir: {room.guest.name}
            </div>
            <div className={styles.dateRange}>
              Giriş/Çıkış: {room.guest.checkInDate} - {room.guest.checkOutDate}
            </div>
          </div>
        )}

        {room.status === 'Under Maintenance' && room.maintenance && (
          <div className={styles.maintenanceInfo}>
            <div className={styles.issueLabel}>
              Bakım: {room.maintenance.issue}
            </div>
            <div className={styles.dateRange}>
              Tahmini Bitiş: {room.maintenance.estimatedCompletionDate}
            </div>
          </div>
        )}

        <div className={styles.cardButtons}>
          <button
            className={styles.detailsButton}
            onClick={() => onViewDetails(room)}
          >
            <FaInfoCircle className={styles.buttonIcon} /> DETAYLAR
          </button>
          
          {room.status === 'Available' && (
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