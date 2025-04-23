// src/components/RoomStatus/RoomStatus.js

import React, { useState, useEffect } from 'react';
import {
    FaTable,
    FaCalendarAlt,
    FaSync,
    FaFilter,
    FaExclamationTriangle,
    FaSearch,
    FaCalendar,
    FaList
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // Yönlendirme için import
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css"; // DatePicker CSS

// Layout ve Child Componentler
import MainLayout from '../Layout/MainLayout'; //
import RoomCard from './RoomCard'; //
import RoomDetailModal from './RoomDetailModal'; //
import ReservationForm from './ReservationForm'; //
import CalendarView from './CalendarView'; //
import styles from './RoomStatus.module.css';

// Servisler
import roomService from '../../services/roomService'; //
import customerService from '../../services/customerService'; // Müşteri servisi import edildi




const RoomStatusPage = () => {
  // --- State Tanımlamaları ---
  const [rooms, setRooms] = useState([]); // API'den gelen tüm odalar (formatlanmış)
  const [filteredRooms, setFilteredRooms] = useState([]); // Filtrelenmiş odalar
  const [roomNumberSearch, setRoomNumberSearch] = useState(''); // Oda no arama inputu
  const [statusFilter, setStatusFilter] = useState(''); // Durum filtresi selectbox'ı
  const [startDate, setStartDate] = useState(null); // Tarih filtresi başlangıç
  const [endDate, setEndDate] = useState(null); // Tarih filtresi bitiş
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false); // Gelişmiş filtre görünürlüğü
  const [selectedFeatures, setSelectedFeatures] = useState([]); // Seçili özellik filtreleri
  const [isLoading, setIsLoading] = useState(true); // Yükleniyor durumu
  const [error, setError] = useState(null); // Hata mesajı state'i
  const [selectedRoom, setSelectedRoom] = useState(null); // Detay/Rezervasyon için seçilen oda
  const [showModal, setShowModal] = useState(false); // Detay modalı görünürlüğü
  const [showReservationForm, setShowReservationForm] = useState(false); // Rezervasyon formu görünürlüğü
  const [viewMode, setViewMode] = useState('list'); // 'list' veya 'calendar' görünümü
  const navigate = useNavigate(); // Yönlendirme hook'u

  // --- Helper Fonksiyonlar ---

  // Tarih string'ini Date objesine çevirir (farklı formatları deneyebilir)
  const parseDateString = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr instanceof Date) return dateStr;
      try {
          let parsedDate = new Date(dateStr); // ISO veya benzeri standart formatları dener
          if (!isNaN(parsedDate.getTime())) return parsedDate;

          // 'dd.MM.yyyy' formatını dene
          const parts = String(dateStr).split('.');
          if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1; // Ay 0-indexed
              const year = parseInt(parts[2], 10);
              if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                  parsedDate = new Date(year, month, day);
                  if (!isNaN(parsedDate.getTime())) return parsedDate;
              }
          }
      } catch(e) {
         console.error("Tarih ayrıştırma hatası (parseDateString):", dateStr, e);
      }
      console.warn("Geçersiz veya tanınmayan tarih formatı (parseDateString):", dateStr);
      return null;
  };

  // Tarihi 'dd.MM.yyyy' formatına çevirir
  const formatDate = (date) => {
      if (!date) return '';
      const d = parseDateString(date);
      if (!d || isNaN(d.getTime())) return '';
      try {
          return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) {
          console.error("Tarih formatlama hatası (formatDate):", date, e);
          return '';
      }
  };

  // Backend'den gelen durum string'ini frontend standardına çevirir
  const mapStatusFromBackend = (status) => {
      const lowerCaseStatus = status ? String(status).toLowerCase() : 'available';
      const statusMap = {
          'available': 'Available',
          'occupied': 'Occupied',
          'maintenance': 'Under Maintenance', // Backend 'Maintenance' -> Frontend 'Under Maintenance'
          'cleaning': 'Cleaning',
      };
      return statusMap[lowerCaseStatus] || 'Available';
  };

  // API'den gelen özellikler verisini diziye çevirir
  const parseFeatures = (features) => {
      if (!features) return [];
      if (Array.isArray(features)) return features;
      if (typeof features === 'string') {
          try {
              const parsed = JSON.parse(features);
              return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
              if (features.includes(',')) return features.split(',').map(f => f.trim()).filter(f => f);
              return features.trim() ? [features.trim()] : [];
          }
      }
      console.warn("Beklenmedik features formatı:", features);
      return [];
  };

  // Tarihi backend'in beklediği 'YYYY-MM-DD' formatına çevirir
  const formatDateForBackend = (dateStr) => {
       const dateObj = parseDateString(dateStr);
       if (!dateObj) return null;
       const year = dateObj.getFullYear();
       const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
       const day = dateObj.getDate().toString().padStart(2, '0');
       return `${year}-${month}-${day}`;
   };


  // --- API Etkileşimleri ---

  // Odaları API'den yükleyen ana fonksiyon
  const loadRoomsFromBackend = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const roomsData = await roomService.getAllRooms(); // API yanıtı: { pageNumber: ..., data: [...] }

      if (roomsData && Array.isArray(roomsData.data)) {
        const formattedRooms = roomsData.data.map(room => {
          return {
             id: room.id || room._id,
             roomNumber: String(room.roomNumber) || '',
             capacity: `${room.capacity || 'Bilinmiyor'} Kişilik`,
             status: mapStatusFromBackend(room.computedStatus), // computedStatus kullanılıyor
             features: parseFeatures(room.features),
             pricePerNight: room.pricePerNight || 0,
             imageUrl: room.imageUrl || null,
             guest: room.guest ? { /* API'den guest gelirse map'le */ } : null,
             maintenance: room.isOnMaintenance ? { // isOnMaintenance kullanılıyor
                 issue: room.description && room.description !== 'none' ? room.description : 'Bakımda',
                 estimatedCompletionDate: 'Bilinmiyor'
             } : null,
             roomType: room.roomType,
             description: room.description,
          };
        });
        setRooms(formattedRooms);
        setFilteredRooms(formattedRooms); // Başlangıçta filtre yok
      } else {
         console.error("API'den geçersiz veri yapısı alındı veya 'data' alanı bulunamadı:", roomsData);
         throw new Error('Oda verileri alınırken beklenmedik bir formatla karşılaşıldı.');
      }
    } catch (err) {
      console.error('Odalar yüklenirken hata:', err);
      const errorMessage = err.message || 'Odalar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
      setError(errorMessage);
      setRooms([]);
      setFilteredRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Component ilk yüklendiğinde odaları çek
  useEffect(() => {
    loadRoomsFromBackend();
  }, []);

  // Filtreler değiştiğinde listeyi güncelle
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...rooms];
      if (roomNumberSearch) {
        filtered = filtered.filter(room => room.roomNumber.toLowerCase().includes(roomNumberSearch.toLowerCase()));
      }
      if (statusFilter) {
        filtered = filtered.filter(room => room.status === statusFilter);
      }
       // Tarih filtrelemesi (frontend'de basit kontrol, backend daha iyi)
      if (startDate && endDate) {
         console.warn("Tarih filtrelemesi frontend'de yapılıyor. Backend filtrelemesi önerilir.");
         const filterStart = new Date(startDate.setHours(0, 0, 0, 0));
         const filterEnd = new Date(endDate.setHours(23, 59, 59, 999));
         filtered = filtered.filter(room => {
           if (room.status === 'Available') return true;
           if (room.status === 'Occupied' && room.guest) {
               const guestCheckIn = parseDateString(room.guest.checkInDate);
               const guestCheckOut = parseDateString(room.guest.checkOutDate);
               if (!guestCheckIn || !guestCheckOut) return false;
               return (guestCheckOut <= filterStart) || (guestCheckIn >= filterEnd); // Çakışmıyorsa göster
           }
           if(room.status === 'Under Maintenance') return true; // Bakımdakileri her zaman göster (opsiyonel)
           return false;
         });
      }
      if (selectedFeatures.length > 0) {
        filtered = filtered.filter(room => selectedFeatures.every(feature => Array.isArray(room.features) && room.features.includes(feature)));
      }
      setFilteredRooms(filtered);
    };
    if (!isLoading) { applyFilters(); } // Sadece yükleme bitince filtrele
  }, [rooms, roomNumberSearch, statusFilter, startDate, endDate, selectedFeatures, isLoading]);

  // --- Event Handler Fonksiyonları ---

  const handleRefresh = () => { loadRoomsFromBackend(); };

  const handleReserve = (room) => { setSelectedRoom(room); setShowReservationForm(true); };

  const handleViewDetails = (room) => { setSelectedRoom(room); setShowModal(true); };

  const handleCloseModal = () => { setShowModal(false); setSelectedRoom(null); };

  const handleCloseReservationForm = () => { setShowReservationForm(false); setSelectedRoom(null); };

  // Mevcut rezervasyonu iptal etme (API Bağlantılı)
  const handleCancelReservation = async (room) => {
    if (!room || !room.guest || !room.guest.reservationId) {
        alert('İptal edilecek geçerli bir rezervasyon bulunamadı.'); return;
    }
    if (window.confirm(`${room.roomNumber} numaralı odanın rezervasyonunu (ID: ${room.guest.reservationId}) iptal etmek istediğinize emin misiniz?`)) {
      setIsLoading(true); setError(null);
      try {
        await roomService.cancelReservation({ reservationId: room.guest.reservationId }); // API Call
        alert(`${room.roomNumber} numaralı oda rezervasyonu başarıyla iptal edildi.`);
        handleCloseModal(); handleRefresh();
      } catch (err) {
        console.error('Rezervasyon iptal edilirken hata:', err.response?.data || err.message);
        const cancelError = err.response?.data?.message || 'Rezervasyon iptal edilirken bir hata oluştu.';
        setError(cancelError); alert(cancelError);
      } finally { setIsLoading(false); }
    }
  };

  // Yeni rezervasyon oluşturma (Müşteri Kontrollü - Frontend Filtrelemeli)
  const handleCreateReservation = async (reservationFormData) => { // Gelen: { idNumber, checkInDate, checkOutDate }
    if (!selectedRoom) { setError("Rezervasyon için oda seçilmedi."); return; }

    setIsLoading(true); setError(null);
    try {
      // 1. Müşteri Kontrolü (Client-side filter kullanan servis)
      const customer = await customerService.getCustomerByIdNumber(reservationFormData.idNumber);

      // 2. Müşteri Yoksa Hata Ver
      if (!customer) {
        // !!! 'customer.id' ve müşteri adı/soyadı alanlarını kendi API yanıtına göre düzelt !!!
        setError(`Kimlik Numarası ${reservationFormData.idNumber} ile kayıtlı müşteri bulunamadı. Lütfen önce müşteri kaydı oluşturun.`);
        // Opsiyonel: Kullanıcıyı kayıt sayfasına yönlendir
        // if (window.confirm("Müşteri bulunamadı. Müşteri kayıt sayfasına gitmek ister misiniz?")) { navigate('/customer-registration'); }
        setIsLoading(false); return;
      }

      // 3. Payload Hazırla
      const payload = {
        roomId: selectedRoom.id,
        // !!! customer.id kısmını API'nin döndürdüğü müşteri ID alanıyla değiştir !!!
        customerId: customer.id,
        checkInDate: formatDateForBackend(reservationFormData.checkInDate),
        checkOutDate: formatDateForBackend(reservationFormData.checkOutDate),
      };
      if (!payload.checkInDate || !payload.checkOutDate) { throw new Error('Geçersiz tarih formatı.'); }

      // 4. Rezervasyon API Çağrısı
      const response = await roomService.reserveRoom(payload);

      // !!! customer.firstName vb. alanları kendi API yanıtına göre düzelt !!!
      alert(`${selectedRoom.roomNumber} numaralı oda için ${customer.firstName || ''} ${customer.lastName || ''} (Müşteri ID: ${customer.id}) adına rezervasyon başarıyla oluşturuldu.`);
      handleCloseReservationForm(); handleRefresh();

    } catch (err) {
      console.error('Rezervasyon işlemi sırasında hata:', err.response?.data || err.message);
      setError(err.message || 'Rezervasyon işlemi sırasında bir hata oluştu.');
    } finally { setIsLoading(false); }
  };

  // Özellik filtresi için checkbox handle'ı
  const handleFeatureSelect = (feature) => {
    const updatedFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature) : [...selectedFeatures, feature];
    setSelectedFeatures(updatedFeatures);
  };

  // --- Render Fonksiyonları ---

  const renderLoading = () => (<div className={styles.loadingContainer}><div className={styles.spinner}></div><div className={styles.loadingText}>Yükleniyor...</div></div>);

  const renderError = () => (error && <div className={styles.errorMessage}><FaExclamationTriangle className={styles.errorIcon} />{error}</div>);

  // Ana Render Metodu
  return (
    <MainLayout title="Oda Durumu">
      <div className={styles.roomStatusPage}>
        {/* Kontroller (Görünüm Değiştirme, Yenile) */}
        <div className={styles.controlsContainer}>
          <div className={styles.viewControls}>
            <button className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`} onClick={() => setViewMode('list')} title="Liste Görünümü"><FaList /> Liste</button>
            <button className={`${styles.viewButton} ${viewMode === 'calendar' ? styles.active : ''}`} onClick={() => setViewMode('calendar')} title="Takvim Görünümü"><FaCalendar /> Takvim</button>
          </div>
          <button className={styles.refreshButton} onClick={handleRefresh} disabled={isLoading} title="Yenile"><FaSync className={isLoading ? styles.spinning : ''} /> YENİLE</button>
        </div>

        <div className={styles.pageHeader}><h1 className={styles.pageTitle}>Oda Durumu</h1></div>
        {renderError()}

        {/* Filtreler */}
        <div className={styles.searchFilters}>
            <div className={styles.filterHeader}>
                <div className={styles.filterTitle}>Filtrele & Ara</div>
                <button className={styles.filtersButton} onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} title="Gelişmiş Filtreler">
                <FaFilter /> {showAdvancedFilters ? 'Gizle' : 'Gelişmiş'}
                </button>
            </div>
            {/* ... (Temel ve Gelişmiş filtre inputları önceki kodda olduğu gibi kalabilir) ... */}
            {/* Temel Filtreler */}
            <div className={styles.searchInputContainer}>
                <div className={styles.inputGroup}>
                <label htmlFor="roomNumberSearch" className={styles.inputLabel}>Oda Numarası Ara</label>
                <input id="roomNumberSearch" type="text" className={styles.inputField} value={roomNumberSearch} onChange={(e) => setRoomNumberSearch(e.target.value)} placeholder="Oda No..." />
                </div>
                <div className={styles.inputGroup}>
                <label htmlFor="statusFilter" className={styles.inputLabel}>Durum Filtresi</label>
                <select id="statusFilter" className={styles.selectField} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">Tüm Durumlar</option>
                    <option value="Available">Müsait</option>
                    <option value="Occupied">Dolu</option>
                    <option value="Under Maintenance">Bakımda</option>
                </select>
                </div>
            </div>

            {/* Gelişmiş Filtreler */}
            {showAdvancedFilters && (
                <div className={styles.advancedFilters}>
                    <div className={styles.dateGroup}>
                        <label className={styles.inputLabel}>Tarih Aralığı</label>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} selectsStart startDate={startDate} endDate={endDate} dateFormat="dd.MM.yyyy" placeholderText="Başlangıç Tarihi" className={styles.inputField} minDate={new Date()} isClearable />
                        <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate || new Date()} dateFormat="dd.MM.yyyy" placeholderText="Bitiş Tarihi" className={styles.inputField} disabled={!startDate} isClearable />
                        </div>
                    </div>
                    <div className={styles.featureGroup}>
                        <label className={styles.inputLabel}>Oda Özellikleri</label>
                        <div className={styles.featureCheckboxGroup}>
                            {['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 'Jacuzzi', 'Coffee Machine'].map(feature => (
                                <label key={feature} className={styles.featureLabel}><input type="checkbox" checked={selectedFeatures.includes(feature)} onChange={() => handleFeatureSelect(feature)} /> {feature}</label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* İçerik Alanı (Liste veya Takvim) */}
        {isLoading ? renderLoading() : (
          !error && (
             <>
                {viewMode === 'list' && (
                <div className={styles.roomGrid}>
                    {filteredRooms.length > 0 ? (
                        filteredRooms.map(room => <RoomCard key={room.id} room={room} onReserve={handleReserve} onViewDetails={handleViewDetails} />)
                    ) : (<div className={styles.noRoomsMessage}>Aradığınız kriterlere uygun oda bulunamadı.</div>)}
                </div>
                )}
                {viewMode === 'calendar' && (
                    <CalendarView rooms={rooms} onViewDetails={handleViewDetails} onReserve={handleReserve} />
                )}
             </>
           )
        )}

        {/* Modallar */}
        {showModal && selectedRoom && <RoomDetailModal room={selectedRoom} onClose={handleCloseModal} onCancelReservation={handleCancelReservation} onReserve={handleReserve} />}
        {showReservationForm && selectedRoom && <ReservationForm room={selectedRoom} onClose={handleCloseReservationForm} onCreateReservation={handleCreateReservation} />}

      </div>
    </MainLayout>
  );
};

export default RoomStatusPage;