import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from './ReservationForm.module.css'; // Doğru CSS modülünü import et
import { FaTimes, FaCalendarCheck, FaUser, FaUsers, FaCalendarDay } from 'react-icons/fa';

// Varsayılan tarihleri belirleyen helper fonksiyonlar
const getDefaultStartDate = () => new Date();
const getDefaultEndDate = (startDate) => {
  const nextDay = new Date(startDate);
  nextDay.setDate(startDate.getDate() + 1);
  return nextDay;
};

const ReservationForm = ({ room, onClose, onCreateReservation }) => {
  // State Tanımlamaları (Aynı)
  const [customerIdNumber, setCustomerIdNumber] = useState('');
  const [startDate, setStartDateState] = useState(getDefaultStartDate());
  const [endDate, setEndDateState] = useState(getDefaultEndDate(startDate));
  // Oda kapasitesi prop'tan gelmiyorsa veya null ise varsayılan 1 olsun
  const [numberOfGuests, setNumberOfGuests] = useState(room?.capacity ? parseInt(room.capacity, 10) : 1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Bitiş tarihi kontrolü (Aynı)
  useEffect(() => {
    if (endDate && startDate && endDate <= startDate) {
      setEndDateState(getDefaultEndDate(startDate));
    }
  }, [startDate, endDate]);

  // Submit Handler (Aynı)
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!customerIdNumber) return setError('Müşteri TC Kimlik Numarası gereklidir.');
    if (!startDate || !endDate) return setError('Başlangıç ve Bitiş tarihleri gereklidir.');
    if (numberOfGuests <= 0) return setError('Misafir sayısı 0\'dan büyük olmalıdır.');

    setIsLoading(true);
    const payload = {
      customerIdNumber: customerIdNumber,
      roomId: room.id,
      startDate: startDate.toISOString(), // ISO Formatı
      endDate: endDate.toISOString(),   // ISO Formatı
      numberOfGuests: parseInt(numberOfGuests, 10)
    };

    try {
      await onCreateReservation(payload);
      // Başarılı olursa RoomStatus kapatacak
    } catch (apiError) {
      setError(apiError.message || 'Rezervasyon oluşturulamadı.');
      console.error("Rezervasyon hatası (form içinde):", apiError);
    } finally {
      setIsLoading(false);
    }
  };

  // DÜZENLENMİŞ JSX YAPISI
  return (
    <div className={styles.modalOverlay} onClick={onClose}> {/* Overlay'e tıklayınca kapat */}
      {/* İçeriğe tıklamanın overlay'i tetiklemesini engelle */}
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Oda {room?.roomNumber} için Rezervasyon</h2>
          <button className={styles.closeButton} onClick={onClose} disabled={isLoading} aria-label="Kapat">
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}>{error}</div>}

            {/* Müşteri TC Kimlik No */}
            <div className={styles.formGroup}>
              <label htmlFor="customerIdNumber" className={styles.label}>
                <FaUser /> Müşteri TC Kimlik No:
              </label>
              <input
                type="text" // Genellikle text olarak alınır
                id="customerIdNumber"
                className={styles.input} // Daha genel bir isim
                value={customerIdNumber}
                onChange={(e) => setCustomerIdNumber(e.target.value)}
                placeholder="11 Haneli TC Kimlik No"
                required
                maxLength={11}
                disabled={isLoading}
              />
            </div>

             {/* Tarih Seçimi (Yan yana göstermek için bir sarmalayıcı) */}
             <div className={styles.datePickerGroup}>
                <div className={styles.formGroup}>
                    <label htmlFor="startDate" className={styles.label}>
                        <FaCalendarDay /> Giriş Tarihi:
                    </label>
                    {/* DatePicker için özel sarmalayıcı (gerekirse stil için) */}
                    <div className={styles.datePickerWrapper}>
                      <DatePicker
                          selected={startDate}
                          onChange={(date) => setStartDateState(date)}
                          selectsStart
                          startDate={startDate}
                          endDate={endDate}
                          dateFormat="dd.MM.yyyy"
                          minDate={new Date()}
                          className={styles.input} // Aynı stil sınıfını kullanabilir
                          id="startDate"
                          required
                          disabled={isLoading}
                          aria-label="Giriş Tarihi Seçici"
                      />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="endDate" className={styles.label}>
                         <FaCalendarDay /> Çıkış Tarihi:
                    </label>
                     <div className={styles.datePickerWrapper}>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDateState(date)}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate ? getDefaultEndDate(startDate) : new Date()}
                            dateFormat="dd.MM.yyyy"
                            className={styles.input} // Aynı stil sınıfını kullanabilir
                            id="endDate"
                            required
                            disabled={isLoading}
                            aria-label="Çıkış Tarihi Seçici"
                        />
                     </div>
                </div>
            </div>

            {/* Misafir Sayısı */}
            <div className={styles.formGroup}>
              <label htmlFor="numberOfGuests" className={styles.label}>
                <FaUsers /> Misafir Sayısı:
              </label>
              <input
                type="number"
                id="numberOfGuests"
                className={styles.input} // Daha genel bir isim
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(e.target.value)}
                min="1"
                // Oda kapasitesi varsa onu max yap, yoksa makul bir limit
                max={room?.capacity ? parseInt(room.capacity, 10) : 10}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          {/* Modal Footer (Butonlar) */}
          <div className={styles.modalFooter}>
            <button type="button" className={`${styles.button} ${styles.cancelButton}`} onClick={onClose} disabled={isLoading}>
              İptal
            </button>
            <button type="submit" className={`${styles.button} ${styles.submitButton}`} disabled={isLoading}>
              {isLoading ? 'İşleniyor...' : <><FaCalendarCheck /> Rezervasyon Oluştur</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationForm;