// src/components/RoomStatus/ReservationForm.js
import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaCheck, FaIdCard } from 'react-icons/fa'; // FaIdCard eklendi, FaUserAlt kaldırıldı
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css"; // CSS import
import styles from './ReservationForm.module.css'; // CSS Module import

// Tarihleri Date objesine çeviren yardımcı fonksiyon (Gerekliyse kullanılır)
const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr; // Zaten Date ise döndür
    try {
        let parsedDate = new Date(dateStr); // ISO vb. dene
        if (!isNaN(parsedDate.getTime())) return parsedDate;
        const parts = String(dateStr).split('.'); // dd.MM.yyyy dene
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                parsedDate = new Date(year, month, day);
                if (!isNaN(parsedDate.getTime())) return parsedDate;
            }
        }
    } catch(e) { /* Hata durumunda null dönecek */ }
    console.warn("Geçersiz tarih formatı (parseDateString):", dateStr)
    return null;
};


const ReservationForm = ({ room, onClose, onCreateReservation }) => {

  // State'i sadece idNumber ve tarihler için ayarla
  const [formData, setFormData] = useState({
    idNumber: '', // Kimlik Numarası state'i
    checkInDate: new Date(),
    checkOutDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Girişten 1 gün sonrası default
  });
  const [errors, setErrors] = useState({}); // Hata mesajları için state

  // Component mount olduğunda veya oda değiştiğinde state'i sıfırla
  useEffect(() => {
    setFormData({
      idNumber: '',
      checkInDate: new Date(),
      checkOutDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    });
    setErrors({}); // Hataları temizle
  }, [room]); // Sadece oda değiştiğinde formu sıfırla

  // Form validasyon kontrolü
  const validateForm = () => {
    let tempErrors = {};
    let formIsValid = true;

    // Kimlik Numarası kontrolleri
    if (!formData.idNumber.trim()) {
      tempErrors.idNumber = 'Kimlik Numarası zorunludur';
      formIsValid = false;
    } else if (!/^\d+$/.test(formData.idNumber.trim())) { // Sadece rakam kontrolü
       tempErrors.idNumber = 'Kimlik Numarası sadece rakamlardan oluşmalıdır';
       formIsValid = false;
    } else if (formData.idNumber.trim().length !== 11) { // Uzunluk kontrolü (TCKN için 11)
       tempErrors.idNumber = 'Kimlik Numarası 11 haneli olmalıdır';
       formIsValid = false;
    }
    // İstersen TCKN algoritma kontrolü de eklenebilir (daha karmaşık)

    // Tarih kontrolü
    const checkIn = formData.checkInDate ? new Date(formData.checkInDate.setHours(0,0,0,0)) : null;
    const checkOut = formData.checkOutDate ? new Date(formData.checkOutDate.setHours(0,0,0,0)) : null;

    if (!checkIn || !checkOut) {
        tempErrors.dates = 'Giriş ve Çıkış tarihleri zorunludur';
        formIsValid = false;
    } else if (checkIn >= checkOut) {
      tempErrors.dates = 'Çıkış tarihi, giriş tarihinden sonra olmalıdır';
      formIsValid = false;
    }

    setErrors(tempErrors); // Hataları state'e yaz
    return formIsValid; // Form geçerli mi? (true/false)
  };

  // Kimlik No input değişikliklerini handle et
  const handleIdNumberChange = (e) => {
    const { name, value } = e.target;
    // Sadece rakam girilmesine izin ver (opsiyonel)
    const onlyNums = value.replace(/[^0-9]/g, '');
    setFormData({
      ...formData,
      [name]: onlyNums // Sadece rakamları state'e yaz
    });
     // Hata varsa temizle
     if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Tarih değişikliklerini handle et
  const handleDateChange = (date, type) => {
    setFormData({
      ...formData,
      [type]: date // type='checkInDate' veya 'checkOutDate'
    });
    // Tarih hatasını temizle
    if (errors.dates) {
        setErrors(prev => ({ ...prev, dates: null }));
    }
  };

  // Form gönderildiğinde (Submit)
  const handleSubmit = (e) => {
    e.preventDefault(); // Sayfanın yeniden yüklenmesini engelle

    if (validateForm()) { // Form geçerliyse devam et
      // Tarihleri 'dd.MM.yyyy' formatına çevir (RoomStatus'a gönderirken)
      const formattedCheckIn = formData.checkInDate.toLocaleDateString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      const formattedCheckOut = formData.checkOutDate.toLocaleDateString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });

      // Sadece gerekli verileri (idNumber, checkInDate, checkOutDate)
      // ana bileşene (RoomStatus) gönder
      onCreateReservation({
        idNumber: formData.idNumber.trim(), // Kimlik No (başındaki/sonundaki boşluklar temizlenmiş)
        checkInDate: formattedCheckIn,        // Formatlanmış giriş tarihi
        checkOutDate: formattedCheckOut       // Formatlanmış çıkış tarihi
      });
       // Not: Müşteri kontrolü ve asıl API çağrısı RoomStatus component'inde yapılacak
    } else {
        console.log("Form validation failed:", errors); // Geçersizse konsola log yaz (opsiyonel)
    }
  };

  // JSX Render
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* Modal Başlığı */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {room ? `${room.roomNumber} Numaralı Oda için Yeni Rezervasyon` : 'Yeni Rezervasyon'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes /> {/* Kapatma ikonu */}
          </button>
        </div>

        {/* Rezervasyon Formu */}
        <form className={styles.reservationForm} onSubmit={handleSubmit}>

          {/* Oda Bilgileri (Sabit gösterilir) */}
          {room && (
             <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Oda Bilgileri</h3>
                 <div style={{display: 'flex', gap: '15px', marginBottom:'10px'}}>
                    {/* Oda Numarası */}
                    <div className={styles.formGroup} style={{flex: 1}}>
                        <label className={styles.formLabel}>Oda Numarası</label>
                        <input type="text" value={room.roomNumber} className={styles.formInput} disabled />
                    </div>
                    {/* Oda Tipi/Kapasitesi */}
                     <div className={styles.formGroup} style={{flex: 1}}>
                        <label className={styles.formLabel}>Oda Tipi/Kapasite</label>
                        <input type="text" value={room.roomType || room.capacity || '?'} className={styles.formInput} disabled />
                    </div>
                 </div>
             </div>
          )}

          {/* Misafir Kimlik Bilgisi Bölümü */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <FaIdCard className={styles.sectionIcon} /> Misafir Kimlik Bilgisi
            </h3>
            {/* Kimlik Numarası Input */}
            <div className={styles.formGroup}>
              <label htmlFor="idNumberInput" className={styles.formLabel}>Kimlik Numarası (TCKN vb.) *</label>
              <input
                id="idNumberInput" // Label için id
                type="text"         // Text olarak alıyoruz, sadece rakam kontrolü handleChange'de
                name="idNumber"     // State key'i ile aynı
                value={formData.idNumber} // State'den değeri bağlıyoruz
                onChange={handleIdNumberChange} // Değişiklikte handleIdNumberChange çalışacak
                className={`${styles.formInput} ${errors.idNumber ? styles.inputError : ''}`} // Hata varsa stil uygula
                placeholder="Misafirin 11 haneli kimlik numarasını girin"
                maxLength={11} // Maksimum 11 karakter (TCKN için)
                inputMode="numeric" // Mobil cihazlarda numerik klavye önerir
                autoComplete="off" // Otomatik tamamlamayı kapat (opsiyonel)
              />
              {/* Hata mesajı gösterimi */}
              {errors.idNumber && <span className={styles.errorText}>{errors.idNumber}</span>}
            </div>
            <small className={styles.helperText}>
                Rezervasyona devam etmek için bu kimlik numarasına sahip misafir sistemde kayıtlı olmalıdır.
             </small>
          </div>

          {/* Rezervasyon Tarihleri Bölümü */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <FaCalendarAlt className={styles.sectionIcon} /> Rezervasyon Tarihleri
            </h3>
            {/* Tarih Seçim Alanı */}
            <div className={`${styles.formGroup} ${styles.dateGroup}`}>
              {/* Giriş Tarihi */}
              <div className={styles.dateField}>
                <label className={styles.formLabel}>Giriş Tarihi *</label>
                <div className={styles.datePickerContainer}>
                  <DatePicker
                    selected={formData.checkInDate} // State'den seçili tarihi al
                    onChange={(date) => handleDateChange(date, 'checkInDate')} // Değişiklikte state'i güncelle
                    minDate={new Date()} // Bugünden önceki tarihler seçilemez
                    dateFormat="dd.MM.yyyy" // Gösterim formatı
                    className={`${styles.formInput} ${errors.dates ? styles.inputError : ''}`} // Hata stili
                    placeholderText="Giriş tarihini seçin"
                  />
                  <FaCalendarAlt className={styles.calendarIcon} /> {/* Takvim ikonu */}
                </div>
              </div>
              {/* Çıkış Tarihi */}
              <div className={styles.dateField}>
                <label className={styles.formLabel}>Çıkış Tarihi *</label>
                <div className={styles.datePickerContainer}>
                  <DatePicker
                    selected={formData.checkOutDate} // State'den seçili tarihi al
                    onChange={(date) => handleDateChange(date, 'checkOutDate')} // Değişiklikte state'i güncelle
                    // Giriş tarihinden en az 1 gün sonrasını seçilebilir yap
                    minDate={formData.checkInDate ? new Date(formData.checkInDate.getTime() + 86400000) : new Date(new Date().getTime() + 86400000)}
                    dateFormat="dd.MM.yyyy" // Gösterim formatı
                    className={`${styles.formInput} ${errors.dates ? styles.inputError : ''}`} // Hata stili
                    placeholderText="Çıkış tarihini seçin"
                  />
                  <FaCalendarAlt className={styles.calendarIcon} /> {/* Takvim ikonu */}
                </div>
              </div>
            </div>
            {/* Tarih hata mesajı gösterimi */}
            {errors.dates && <span className={styles.errorText}>{errors.dates}</span>}
          </div>

          {/* Form Footer ve Butonlar */}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              İPTAL
            </button>
            <button type="submit" className={styles.submitButton}>
              <FaCheck className={styles.buttonIcon} /> REZERVASYON OLUŞTUR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationForm;