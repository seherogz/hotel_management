// Frontend/src/components/RoomStatus/RoomStatus.js

import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css"; // DatePicker CSS
import { useNavigate } from 'react-router-dom';
// Gerekli date-fns fonksiyonları
import { format as formatDateFns, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, parseISO, isEqual } from 'date-fns';
import { tr } from 'date-fns/locale';
// İkonlar
import { FaTable, FaCalendarAlt, FaSync, FaFilter, FaExclamationTriangle, FaSearch, FaCalendar, FaList } from 'react-icons/fa';

// Bileşenleri import et
import RoomCard from './RoomCard'; // Liste görünümü için
import RoomDetailModal from './RoomDetailModal'; // Detay modalı
import ReservationForm from './ReservationForm'; // Rezervasyon modalı
import CalendarView from './CalendarView'; // Haftalık görünüm için güncellenmiş
import styles from './RoomStatus.module.css'; // Stil modülü
import roomService from '../../services/roomService'; // Güncellenmiş servis

// --- Helper Fonksiyonlar ---

// Tarihi Backend İçin Formatla ('YYYY-MM-DD')
const formatDateForBackend = (date) => {
  if (!date) return null;
  try {
    const dateObj = (date instanceof Date) ? date : parseISO(String(date)); // ISO parse etmeyi dene
    if (isNaN(dateObj.getTime())) return null;
    return formatDateFns(dateObj, 'yyyy-MM-dd');
  } catch (e) {
    console.error("formatDateForBackend hatası:", date, e);
    return null;
  }
};

// Özellikleri Parse Et (String veya JSON Array -> Array)
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


// --- RoomStatusPage Bileşeni ---
const RoomStatusPage = () => {
  // --- State Tanımlamaları ---
  const [rooms, setRooms] = useState([]); // Backend'den gelen veri (liste VEYA takvim formatı)
  const [filteredRooms, setFilteredRooms] = useState([]); // Sadece Liste görünümünde kullanılan filtrelenmiş liste
  const [roomNumberSearch, setRoomNumberSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // Liste görünümü filtre tarihleri (başlangıçta boş)
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  // Takvim görünümünün mevcut HAFTASININ başlangıç tarihini tutar
  const [calendarWeekStart, setCalendarWeekStart] = useState(() => startOfWeek(new Date(), { locale: tr, weekStartsOn: 1 }));
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false); // Gelişmiş filtre görünürlüğü
  const [isLoading, setIsLoading] = useState(true); // Yükleniyor durumu
  const [error, setError] = useState(null); // Hata mesajı
  const [selectedRoom, setSelectedRoom] = useState(null); // Modallar için seçili oda
  const [showModal, setShowModal] = useState(false); // Detay modalı görünürlüğü
  const [showReservationForm, setShowReservationForm] = useState(false); // Rezervasyon formu görünürlüğü
  const [viewMode, setViewMode] = useState('list'); // Başlangıç modu 'list'
  const navigate = useNavigate(); // React Router (gerekirse)

  // --- Backend'den Veri Yükleme Fonksiyonu ---
  const loadDataForView = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log(`Veri yükleniyor: Mod=${viewMode}`);

    try {
      let apiResponse; // Ham API yanıtı
      let processedData = []; // İşlenmiş veri

      if (viewMode === 'calendar') {
        // TAKVİM MODU: /v1/Room/CalendarView endpoint'ini çağır
        // calendarWeekStart state'ine göre haftalık aralığı hesapla
        const weekStartDate = startOfWeek(calendarWeekStart, { weekStartsOn: 1 });
        const weekEndDate = endOfWeek(calendarWeekStart, { weekStartsOn: 1 });
        const params = {
          StartDate: formatDateForBackend(weekStartDate),
          EndDate: formatDateForBackend(weekEndDate),
        };

        if (params.StartDate && params.EndDate) {
          console.log("API İsteği (Takvim Haftalık):", params);
          apiResponse = await roomService.getCalendarViewData(params); // Yeni servis fonksiyonu
          // Gelen veri: [{ roomId, roomNumber, dailyStatuses: [...] }]
           if (apiResponse && Array.isArray(apiResponse)) { // Direkt dizi varsayımı
             processedData = apiResponse;
          } else if (apiResponse && Array.isArray(apiResponse.data)) { // { data: [...] } varsayımı
             processedData = apiResponse.data;
          } else {
              console.error("Takvim API'sinden geçersiz veri:", apiResponse);
              processedData = [];
          }
        } else {
             console.warn("Takvim için geçersiz hafta başlangıcı, istek atlanıyor.");
             processedData = [];
        }

      } else { // viewMode === 'list'
        // LİSTE MODU: /v1/Room endpoint'ini çağır
        const params = {};
        const formattedStartDate = formatDateForBackend(startDate);
        const formattedEndDate = formatDateForBackend(endDate);
        // Sadece iki tarih de seçiliyse parametreleri ekle
        if (formattedStartDate && formattedEndDate) {
          params.AvailabilityStartDate = formattedStartDate;
          params.AvailabilityEndDate = formattedEndDate;
        }
         console.log("API İsteği (Liste):", params);
        apiResponse = await roomService.getAllRooms(params); // Genel oda endpoint'i

         // Gelen veriyi işle (computedStatus belirle vs.)
         if (apiResponse && Array.isArray(apiResponse.data)) { // .data gerekebilir
             processedData = apiResponse.data.map(room => { // .data gerekebilir
                 let finalStatus = 'Available';
                 if (room.isOnMaintenance === true) { finalStatus = 'Maintenance'; }
                 else if (room.computedStatus?.toLowerCase() === 'occupied') { finalStatus = 'Occupied'; }
                 else { finalStatus = 'Available'; }
                 // Frontend için RoomCard'ın beklediği formatta obje oluştur
                 return {
                    id: room.id || room._id, // Liste görünümü ID kullanır
                    roomNumber: String(room.roomNumber) || '',
                    capacity: `${room.capacity || '?'}`,
                    computedStatus: finalStatus, // Hesaplanan durum
                    occupantName: room.occupantName || null,
                    occupantCheckInDate: room.occupantCheckInDate || null,
                    occupantCheckOutDate: room.occupantCheckOutDate || null,
                    currentReservationId: room.currentReservationId || null,
                    features: parseFeatures(room.features),
                    pricePerNight: room.pricePerNight || 0,
                    roomType: room.roomType || '',
                    description: room.description || '',
                 };
             });
         } else {
             console.error("Liste API'sinden geçersiz veri:", apiResponse);
             processedData = [];
         }
      }

      setRooms(processedData); // Ana state'i güncelle (takvim veya liste verisi ile)

    } catch (err) {
       console.error(`${viewMode} için veri yüklenirken hata:`, err);
       const errorMessage = typeof err === 'string' ? err : (err.message || err.title || 'Veri yüklenirken bir hata oluştu.');
       setError(errorMessage);
       setRooms([]); // Hata durumunda temizle
       setFilteredRooms([]); // Hata durumunda temizle
    } finally {
      setIsLoading(false);
    }
  }, [viewMode, startDate, endDate, calendarWeekStart, setIsLoading, setError, setRooms]); // Bağımlılıklar


  // --- useEffect Hook'ları ---

  // 1. Veri çekmeyi tetikleyen useEffect:
  useEffect(() => {
    console.log("Veri çekme useEffect tetiklendi, viewMode:", viewMode);
    loadDataForView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDataForView]); // loadDataForView useCallback ile sarmalandığı için güvenli


  // 2. Frontend filtrelemelerini uygulayan useEffect (Sadece Liste modunda):
  useEffect(() => {
    // 'rooms' state'i backend'den gelen hem liste hem takvim verisini tutuyor.
    // Sadece liste verisi formatındaysa filtreleme yap.
    const isListData = rooms && rooms.length > 0 && rooms[0]?.computedStatus !== undefined && rooms[0]?.dailyStatuses === undefined;

    if (viewMode === 'list' && isListData) {
      const applyFrontendFilters = () => {
        console.log("Frontend filtreleri uygulanıyor (Liste Modu)...");
        let tempFiltered = [...rooms];
        if (roomNumberSearch) {
           tempFiltered = tempFiltered.filter(room =>
                room.roomNumber.toLowerCase().includes(roomNumberSearch.toLowerCase())
            );
        }
        if (statusFilter) {
           tempFiltered = tempFiltered.filter(room =>
                room.computedStatus === statusFilter
            );
        }
        if (selectedFeatures.length > 0) {
            tempFiltered = tempFiltered.filter(room =>
                selectedFeatures.every(feature =>
                    Array.isArray(room.features) && room.features.includes(feature)
                )
            );
        }
        setFilteredRooms(tempFiltered);
      };
      if (!isLoading) { applyFrontendFilters(); }
    } else {
      // Takvim modundaysa veya liste verisi henüz doğru formatta değilse
      // filtrelenmiş listeyi ham listeye eşitle
      setFilteredRooms([...rooms]);
    }
  }, [rooms, roomNumberSearch, statusFilter, selectedFeatures, isLoading, viewMode]);


  // --- Handler Fonksiyonlar ---

  // Takvimden Gelen Hafta Değişikliği Handler'ı
  const handleCalendarWeekChange = useCallback((newWeekStartDate) => {
    console.log("handleCalendarWeekChange çalıştı, yeni başlangıç:", newWeekStartDate);
    // Yeni haftanın başlangıcını state'e ata
    // Ensure it's a valid date before setting
    if (newWeekStartDate instanceof Date && !isNaN(newWeekStartDate.getTime())) {
       setCalendarWeekStart(newWeekStartDate);
    } else {
        console.error("handleCalendarWeekChange geçersiz tarih aldı:", newWeekStartDate);
        // Optionally reset to today or show error
        setCalendarWeekStart(startOfWeek(new Date(), { locale: tr, weekStartsOn: 1 }));
    }
  }, []); // Boş dependency array


  // Rezervasyon Oluşturma Handler'ı
  const handleCreateReservation = async (reservationPayload) => {
    console.log('handleCreateReservation çağrıldı, payload:', reservationPayload);
    setError(null);
    setIsLoading(true); // Başlat
    try {
      const response = await roomService.reserveRoom(reservationPayload);
      console.log("Rezervasyon API yanıtı:", response);
      alert(`Oda ${reservationPayload.roomId} için rezervasyon başarıyla oluşturuldu!`);
      handleCloseReservationForm();
      loadDataForView(); // Veriyi yeniden yükle
    } catch (apiError) {
      console.error('Rezervasyon işlemi sırasında hata (RoomStatus):', apiError);
      const errorMessage = typeof apiError === 'string' ? apiError : (apiError.message || apiError.title || 'Rezervasyon oluşturulurken bir hata oluştu.');
      setError(errorMessage);
      alert(`Hata: ${errorMessage}`);
    } finally {
      setIsLoading(false); // Bitir
    }
  };

  // Rezervasyon İptal Handler'ı
  const handleCancelReservation = async (reservationId) => {
    if (reservationId === null || reservationId === undefined) {
        alert('İptal edilecek geçerli bir rezervasyon ID bulunamadı.');
        return;
    }
    if (window.confirm(`Rezervasyon ID: ${reservationId} olan rezervasyonu iptal etmek istediğinize emin misiniz?`)) {
      setIsLoading(true);
      setError(null);
      try {
        await roomService.cancelReservation(reservationId);
        alert(`Rezervasyon (ID: ${reservationId}) başarıyla iptal edildi.`);
        handleCloseModal();
        loadDataForView();
      } catch (err) {
         console.error(`Rezervasyon (ID: ${reservationId}) iptal edilirken hata:`, err);
         const errorMessage = typeof err === 'string' ? err : (err.message || err.title || 'Rezervasyon iptal edilirken bir hata oluştu.');
         setError(errorMessage);
         alert(`Hata: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Diğer Standard Handler'lar
  const handleRefresh = () => { loadDataForView(); };
  const handleReserve = (room) => { setSelectedRoom(room); setShowReservationForm(true); };
  const handleViewDetails = (room) => { setSelectedRoom(room); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setSelectedRoom(null); setError(null); };
  const handleCloseReservationForm = () => { setShowReservationForm(false); setSelectedRoom(null); setError(null); };
  const handleFeatureSelect = (feature) => {
    setSelectedFeatures(prev => prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]);
  };


  // Render Fonksiyonları
  const renderLoading = () => (<div className={styles.loadingContainer}><div className={styles.spinner}></div><div className={styles.loadingText}>Yükleniyor...</div></div>);
  const renderError = () => (error && <div className={styles.errorMessage}><FaExclamationTriangle className={styles.errorIcon} />{error}</div>);


  // --- Ana Render (JSX) ---
  return (
      <div className={styles.roomStatusPage}>
        {/* Kontroller (Görünüm Değiştirme, Yenile) */}
        <div className={styles.controlsContainer}>
          <div className={styles.viewControls}>
            <button className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`} onClick={() => setViewMode('list')} title="Liste Görünümü"><FaList /> Liste</button>
            <button className={`${styles.viewButton} ${viewMode === 'calendar' ? styles.active : ''}`} onClick={() => setViewMode('calendar')} title="Takvim Görünümü"><FaCalendar /> Takvim</button>
          </div>
          <button className={styles.refreshButton} onClick={handleRefresh} disabled={isLoading} title="Yenile"><FaSync className={isLoading ? styles.spinning : ''} /> YENİLE</button>
        </div>

        {/* Başlık ve Hata */}
        <div className={styles.pageHeader}><h1 className={styles.pageTitle}>Oda Durumu</h1></div>
        {error && renderError()} {/* Hata varsa göster */}

        {/* Filtreler (Sadece Liste modunda) */}
        {viewMode === 'list' && (
            <div className={styles.searchFilters}>
                <div className={styles.filterHeader}>
                    <div className={styles.filterTitle}>Filtrele & Ara</div>
                    <button className={styles.filtersButton} onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} title="Gelişmiş Filtreler">
                    <FaFilter /> {showAdvancedFilters ? 'Gizle' : 'Gelişmiş'}
                    </button>
                </div>
                {/* Temel Filtreler */}
                <div className={styles.searchInputContainer}>
                    {/* Oda Numarası Input */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="roomNumberSearch" className={styles.inputLabel}>Oda Numarası Ara</label>
                        <input id="roomNumberSearch" type="text" className={styles.inputField} value={roomNumberSearch} onChange={(e) => setRoomNumberSearch(e.target.value)} placeholder="Oda No..." />
                    </div>
                    {/* Durum Select */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="statusFilter" className={styles.inputLabel}>Durum Filtresi</label>
                        <select id="statusFilter" className={styles.selectField} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">Tüm Durumlar</option>
                            <option value="Available">Müsait</option>
                            <option value="Occupied">Dolu</option>
                            <option value="Maintenance">Bakımda</option>
                        </select>
                    </div>
                </div>
                {/* Gelişmiş Filtreler */}
                {showAdvancedFilters && (
                    <div className={styles.advancedFilters}>
                        {/* Tarih Aralığı Seçici */}
                        <div className={styles.dateGroup}>
                            <label className={styles.inputLabel}>Müsaitlik Tarih Aralığı</label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} selectsStart startDate={startDate} endDate={endDate} dateFormat="dd.MM.yyyy" placeholderText="Başlangıç Tarihi" className={styles.inputField} isClearable />
                                <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} dateFormat="dd.MM.yyyy" placeholderText="Bitiş Tarihi" className={styles.inputField} disabled={!startDate} isClearable />
                            </div>
                        </div>
                         {/* Özellik Seçici */}
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
        )} {/* viewMode === 'list' sonu */}


        {/* İçerik Alanı (Liste veya Takvim) */}
        {/* Hata yoksa ve yüklenmiyorsa içeriği göster */}
        {!isLoading && !error && (
             <>
                {viewMode === 'list' && (
                  // Liste görünümü: filteredRooms'u map et
                  <div className={styles.roomGrid}>
                      {/* filteredRooms boş değilse kartları göster */}
                      {filteredRooms && filteredRooms.length > 0 ? (
                          filteredRooms.map(room => <RoomCard key={room.id} room={room} onReserve={handleReserve} onViewDetails={handleViewDetails} />)
                      ) : (
                          // filteredRooms boşsa (filtre sonucu veya veri yoksa)
                          <div className={styles.noRoomsMessage}>Aradığınız kriterlere uygun oda bulunamadı.</div>
                      )}
                  </div>
                )}
                {viewMode === 'calendar' && (
                  // Takvim görünümü: rooms (takvim formatındaki veri) ve callback'i gönder
                  <CalendarView
                      rooms={rooms} // Direkt backend'den gelen takvim verisini gönder
                      onViewDetails={handleViewDetails}
                      onReserve={handleReserve} // Takvimden rezervasyon? Opsiyonel.
                      onWeekChange={handleCalendarWeekChange} // Hafta değişikliği callback'i
                      // Takvime mevcut hafta başlangıcını prop olarak gönderiyoruz
                      displayWeekStart={calendarWeekStart}
                  />
                )}
             </>
        )}
        {/* Yükleniyorsa yüklenme göstergesini göster */}
        {isLoading && renderLoading()}


        {/* Modallar */}
        {showModal && selectedRoom && <RoomDetailModal room={selectedRoom} onClose={handleCloseModal} onCancelReservation={handleCancelReservation} onReserve={handleReserve} />}
        {showReservationForm && selectedRoom && (
          <ReservationForm
            room={selectedRoom} // Seçili odayı prop olarak geç
            onClose={handleCloseReservationForm}
            onCreateReservation={handleCreateReservation} // Handler fonksiyonunu prop olarak geç
          />
        )}

      </div>
  );
};

export default RoomStatusPage;