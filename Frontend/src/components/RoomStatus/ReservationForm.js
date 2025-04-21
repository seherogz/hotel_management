import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaPhone, FaEnvelope, FaCalendarAlt, FaCreditCard, FaUsers } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from './ReservationForm.module.css';
import { findOrCreateCustomer, createReservation } from './apiService';

const ReservationForm = ({ room, onClose, onCreateReservation, startDate, endDate }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [checkInDate, setCheckInDate] = useState(startDate || new Date());
  const [checkOutDate, setCheckOutDate] = useState(endDate || new Date(Date.now() + 86400000)); // Default to tomorrow
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [numberOfGuests, setNumberOfGuests] = useState(getDefaultGuestCount(room));
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Room's nightly rate
  const pricePerNight = room?.pricePerNight || 0;
  
  // Get default guest count based on room capacity
  function getDefaultGuestCount(room) {
    if (!room || !room.capacity) return 2;
    const capacityMatch = room.capacity.match(/\d+/);
    return capacityMatch ? parseInt(capacityMatch[0]) : 2;
  }
  
  // Calculate total price
  const calculateTotalPrice = () => {
    if (!checkInDate || !checkOutDate) return 0;
    
    // Calculate difference in days
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Calculate total price
    return nights * pricePerNight;
  };
  
  const totalPrice = calculateTotalPrice();

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = 'Ad gereklidir';
    if (!lastName.trim()) newErrors.lastName = 'Soyad gereklidir';
    if (!email.trim()) newErrors.email = 'E-posta gereklidir';
    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Telefon numarası gereklidir';
    if (!checkInDate) newErrors.checkInDate = 'Giriş tarihi gereklidir';
    if (!checkOutDate) newErrors.checkOutDate = 'Çıkış tarihi gereklidir';
    if (checkInDate && checkOutDate && checkInDate >= checkOutDate) {
      newErrors.checkOutDate = 'Çıkış tarihi giriş tarihinden sonra olmalıdır';
    }
    if (numberOfGuests < 1) newErrors.numberOfGuests = 'En az 1 misafir olmalıdır';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsProcessing(true);
    setStatusMessage('Rezervasyon işleniyor...');
    
    try {
      // First find or create customer
      setStatusMessage('Müşteri bilgileri kontrol ediliyor...');
      const customerResponse = await findOrCreateCustomer({
        firstName,
        lastName,
        email,
        phoneNumber
      });
      
      // If existing customer found, show info
      if (customerResponse.exists) {
        setStatusMessage(`Mevcut müşteri bulundu: ${firstName} ${lastName}`);
      } else {
        setStatusMessage(`Yeni müşteri oluşturuldu: ${firstName} ${lastName}`);
      }
      
      const customerId = customerResponse.customer.id;
      
      // Now create reservation with required fields
      setStatusMessage('Rezervasyon oluşturuluyor...');
      const reservationResponse = await createReservation({
        roomId: room.id,
        customerId,
        startDate: checkInDate,
        endDate: checkOutDate,
        numberOfGuests,
        totalPrice,
        paymentMethod
      });
      
      if (reservationResponse.error) {
        throw new Error(reservationResponse.error);
      }
      
      // Show success message
      setStatusMessage('Rezervasyon başarıyla oluşturuldu!');
      
      // Collect form data and send to parent component
      const reservationData = {
        roomId: room.id,
        customerId,
        fullName: `${firstName} ${lastName}`,
        email,
        phoneNumber,
        checkInDate: formatDateForDisplay(checkInDate),
        checkOutDate: formatDateForDisplay(checkOutDate),
        numberOfGuests,
        totalPrice,
        paymentMethod,
        reservationId: reservationResponse.id || reservationResponse.data?.id
      };
      
      setTimeout(() => {
        onCreateReservation(reservationData);
      }, 1000);
      
    } catch (error) {
      console.error('Rezervasyon oluşturulurken hata:', error);
      setStatusMessage(`Hata: ${error.message || 'Rezervasyon oluşturulamadı. Lütfen tekrar deneyin.'}`);
      setIsProcessing(false);
    }
  };

  // Date format helper
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Rezervasyon Oluştur - Oda {room.roomNumber}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.roomInfo}>
          <div className={styles.roomDetails}>
            <h3>{room.capacity} - {room.roomNumber} Numaralı Oda</h3>
            <p className={styles.priceInfo}>Gecelik Ücret: ₺{pricePerNight.toLocaleString('tr-TR')}</p>
          </div>
        </div>
        
        {isProcessing && (
          <div className={styles.processingMessage}>
            <div className={styles.spinner}></div>
            <p>{statusMessage}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.reservationForm}>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName">
                <FaUser />
                <span>Ad</span>
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={errors.firstName ? styles.errorInput : ''}
                disabled={isProcessing}
              />
              {errors.firstName && <div className={styles.errorMessage}>{errors.firstName}</div>}
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="lastName">
                <FaUser />
                <span>Soyad</span>
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={errors.lastName ? styles.errorInput : ''}
                disabled={isProcessing}
              />
              {errors.lastName && <div className={styles.errorMessage}>{errors.lastName}</div>}
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">
                <FaEnvelope />
                <span>E-posta</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? styles.errorInput : ''}
                disabled={isProcessing}
              />
              {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="phoneNumber">
                <FaPhone />
                <span>Telefon</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={errors.phoneNumber ? styles.errorInput : ''}
                disabled={isProcessing}
              />
              {errors.phoneNumber && <div className={styles.errorMessage}>{errors.phoneNumber}</div>}
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="checkInDate">
                <FaCalendarAlt />
                <span>Giriş Tarihi</span>
              </label>
              <DatePicker
                id="checkInDate"
                selected={checkInDate}
                onChange={(date) => setCheckInDate(date)}
                selectsStart
                startDate={checkInDate}
                endDate={checkOutDate}
                minDate={new Date()}
                dateFormat="dd.MM.yyyy"
                className={errors.checkInDate ? styles.errorInput : styles.datePicker}
                disabled={isProcessing}
              />
              {errors.checkInDate && <div className={styles.errorMessage}>{errors.checkInDate}</div>}
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="checkOutDate">
                <FaCalendarAlt />
                <span>Çıkış Tarihi</span>
              </label>
              <DatePicker
                id="checkOutDate"
                selected={checkOutDate}
                onChange={(date) => setCheckOutDate(date)}
                selectsEnd
                startDate={checkInDate}
                endDate={checkOutDate}
                minDate={new Date(checkInDate?.getTime() + 86400000)} // At least one day after check-in
                dateFormat="dd.MM.yyyy"
                className={errors.checkOutDate ? styles.errorInput : styles.datePicker}
                disabled={isProcessing}
              />
              {errors.checkOutDate && <div className={styles.errorMessage}>{errors.checkOutDate}</div>}
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="numberOfGuests">
                <FaUsers />
                <span>Misafir Sayısı</span>
              </label>
              <input
                type="number"
                id="numberOfGuests"
                min="1"
                max={getDefaultGuestCount(room)}
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 1)}
                className={errors.numberOfGuests ? styles.errorInput : ''}
                disabled={isProcessing}
              />
              {errors.numberOfGuests && <div className={styles.errorMessage}>{errors.numberOfGuests}</div>}
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="paymentMethod">
                <FaCreditCard />
                <span>Ödeme Yöntemi</span>
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={isProcessing}
              >
                <option value="creditCard">Kredi Kartı</option>
                <option value="cash">Nakit</option>
                <option value="bankTransfer">Banka Transferi</option>
              </select>
            </div>
          </div>
          
          <div className={styles.totalPriceContainer}>
            <div className={styles.totalPriceLabel}>Toplam Fiyat:</div>
            <div className={styles.totalPriceValue}>
              ₺{totalPrice.toLocaleString('tr-TR')}
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.cancelButton} 
              onClick={onClose}
              disabled={isProcessing}
            >
              İptal
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isProcessing}
            >
              Rezervasyonu Onayla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationForm; 