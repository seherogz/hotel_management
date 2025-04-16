import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaCheck, FaUserAlt } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from './ReservationForm.module.css';

const ReservationForm = ({ room, onClose, onCreateReservation }) => {
  // Mevcut rezervasyon bilgileri varsa kullan, yoksa yeni oluştur
  const initializeFormData = () => {
    // Eğer oda rezerve edilmişse ve misafir bilgisi varsa, mevcut bilgileri kullan
    if (room && room.status === 'Occupied' && room.guest) {
      // Mevcut tarihleri Date objesine çevir
      const parseDate = (dateStr) => {
        if (!dateStr) return new Date();
        const [day, month, year] = dateStr.split('.');
        return new Date(year, month - 1, day);
      };
      
      return {
        fullName: room.guest.name || '',
        phoneNumber: room.guest.phoneNumber || '',
        checkInDate: parseDate(room.guest.checkInDate),
        checkOutDate: parseDate(room.guest.checkOutDate),
        reservationId: room.guest.reservationId || generateReservationId(),
      };
    }
    
    // Yeni rezervasyon için varsayılan değerler
    return {
      fullName: '',
      phoneNumber: '',
      checkInDate: new Date(),
      checkOutDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      reservationId: generateReservationId(),
    };
  };

  const [formData, setFormData] = useState(initializeFormData());
  const [errors, setErrors] = useState({});
  const [isExistingReservation, setIsExistingReservation] = useState(
    room && room.status === 'Occupied' && room.guest ? true : false
  );

  // Oda değiştiğinde form verilerini güncelle
  useEffect(() => {
    setFormData(initializeFormData());
    setIsExistingReservation(room && room.status === 'Occupied' && room.guest ? true : false);
  }, [room]);

  // Rezervasyon ID oluşturma
  function generateReservationId() {
    const prefix = 'RES';
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 haneli rastgele sayı
    return `${prefix}${randomNum}`;
  }

  // Form validasyon kontrolü
  const validateForm = () => {
    let tempErrors = {};
    let formIsValid = true;

    if (!formData.fullName.trim()) {
      tempErrors.fullName = 'İsim Soyisim gerekli';
      formIsValid = false;
    }

    if (formData.checkInDate >= formData.checkOutDate) {
      tempErrors.dates = 'Çıkış tarihi giriş tarihinden sonra olmalıdır';
      formIsValid = false;
    }

    setErrors(tempErrors);
    return formIsValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateChange = (date, type) => {
    setFormData({
      ...formData,
      [type]: date
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Tarihleri uygun formata dönüştür
      const formattedCheckIn = formData.checkInDate.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      const formattedCheckOut = formData.checkOutDate.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Rezervasyon verilerini ana bileşene gönder
      onCreateReservation({
        ...formData,
        checkInDate: formattedCheckIn,
        checkOutDate: formattedCheckOut
      });
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {room ? `${room.roomNumber} Numaralı Oda için ${isExistingReservation ? 'Mevcut Rezervasyon' : 'Yeni Rezervasyon'}` : 'Yeni Rezervasyon'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form className={styles.reservationForm} onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <FaUserAlt className={styles.sectionIcon} /> Misafir Bilgileri
            </h3>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>İsim Soyisim *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`${styles.formInput} ${errors.fullName ? styles.inputError : ''}`}
                placeholder="Misafir adı ve soyadı"
              />
              {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Telefon Numarası (Opsiyonel)</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="05XX XXX XX XX"
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <FaCalendarAlt className={styles.sectionIcon} /> Rezervasyon Tarihleri
            </h3>

            <div className={`${styles.formGroup} ${styles.dateGroup}`}>
              <div className={styles.dateField}>
                <label className={styles.formLabel}>Giriş Tarihi *</label>
                <div className={styles.datePickerContainer}>
                  <DatePicker
                    selected={formData.checkInDate}
                    onChange={(date) => handleDateChange(date, 'checkInDate')}
                    minDate={isExistingReservation ? undefined : new Date()}
                    dateFormat="dd.MM.yyyy"
                    className={styles.formInput}
                  />
                  <FaCalendarAlt className={styles.calendarIcon} />
                </div>
              </div>

              <div className={styles.dateField}>
                <label className={styles.formLabel}>Çıkış Tarihi *</label>
                <div className={styles.datePickerContainer}>
                  <DatePicker
                    selected={formData.checkOutDate}
                    onChange={(date) => handleDateChange(date, 'checkOutDate')}
                    minDate={new Date(formData.checkInDate.getTime() + 86400000)} // Giriş tarihinden en az 1 gün sonra
                    dateFormat="dd.MM.yyyy"
                    className={styles.formInput}
                  />
                  <FaCalendarAlt className={styles.calendarIcon} />
                </div>
              </div>
            </div>
            {errors.dates && <span className={styles.errorText}>{errors.dates}</span>}
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              Rezervasyon Bilgileri
            </h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Rezervasyon ID</label>
              <input
                type="text"
                value={formData.reservationId}
                className={styles.formInput}
                disabled
              />
              <small className={styles.helperText}>
                {isExistingReservation ? 'Mevcut rezervasyon ID' : 'Sistem tarafından otomatik oluşturuldu'}
              </small>
            </div>

            {room && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Oda Numarası</label>
                <input
                  type="text"
                  value={room.roomNumber}
                  className={styles.formInput}
                  disabled
                />
              </div>
            )}
            
            {room && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Oda Tipi</label>
                <input
                  type="text"
                  value={room.capacity || '2 Kişilik'}
                  className={styles.formInput}
                  disabled
                />
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              İPTAL
            </button>
            <button type="submit" className={styles.submitButton}>
              <FaCheck className={styles.buttonIcon} /> {isExistingReservation ? 'REZERVASYONU GÜNCELLE' : 'REZERVASYON OLUŞTUR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationForm; 