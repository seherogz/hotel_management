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
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import MainLayout from '../Layout/MainLayout';
import RoomCard from './RoomCard';
import RoomDetailModal from './RoomDetailModal';
import ReservationForm from './ReservationForm';
import styles from './RoomStatus.module.css';
import CalendarView from './CalendarView';
import roomService from '../../services/roomService'; // roomService'i import et

// Mock data for rooms (Hata durumunda veya test için kullanılabilir)
const mockRooms = [
    // ... (mock data içeriği aynı kalabilir) ...
    {
        id: 1,
        roomNumber: '101',
        capacity: '2 Kişilik',
        status: 'Available',
        features: ['TV', 'Minibar', 'Wi-Fi'],
        pricePerNight: 450,
        imageUrl: '/images/rooms/double_standard_1.jpg'
      },
      {
        id: 2,
        roomNumber: '102',
        capacity: '2 Kişilik',
        status: 'Occupied',
        features: ['TV', 'Minibar', 'Wi-Fi'],
        pricePerNight: 450,
        imageUrl: '/images/rooms/double_standard_2.jpg',
        guest: {
          name: 'Ayşe Yılmaz',
          checkInDate: '22.03.2025',
          checkOutDate: '25.03.2025'
        }
      },
      {
        id: 3,
        roomNumber: '103',
        capacity: '2 Kişilik',
        status: 'Under Maintenance',
        features: ['TV', 'Minibar', 'Wi-Fi'],
        pricePerNight: 450,
        imageUrl: '/images/rooms/double_standard_3.jpg',
        maintenance: {
          issue: 'Klima arızası',
          estimatedCompletionDate: '26.03.2025'
        }
      },
      {
        id: 4,
        roomNumber: '104',
        capacity: '4 Kişilik',
        status: 'Occupied',
        features: ['TV', 'Minibar', 'Wi-Fi'],
        pricePerNight: 750,
        imageUrl: '/images/rooms/quad_standard_1.jpg',
        guest: {
          name: 'Ali Kaya',
          checkInDate: '22.03.2025',
          checkOutDate: '28.03.2025'
        }
      },
      {
        id: 5,
        roomNumber: '105',
        capacity: '2 Kişilik',
        status: 'Available',
        features: ['TV', 'Minibar', 'Wi-Fi'],
        pricePerNight: 450,
        imageUrl: '/images/rooms/double_standard_2.jpg'
      },
      {
        id: 6,
        roomNumber: '201',
        capacity: '2 Kişilik',
        status: 'Available',
        features: ['TV', 'Minibar', 'Wi-Fi'],
        pricePerNight: 500,
        imageUrl: '/images/rooms/double_deluxe_1.jpg'
      },
      {
        id: 7,
        roomNumber: '202',
        capacity: '2 Kişilik',
        status: 'Occupied',
        features: ['TV', 'Minibar', 'Wi-Fi'],
        pricePerNight: 500,
        imageUrl: '/images/rooms/double_deluxe_2.jpg',
        guest: {
          name: 'Zeynep Demir',
          checkInDate: '21.03.2025',
          checkOutDate: '26.03.2025'
        }
      },
      {
        id: 8,
        roomNumber: '203',
        capacity: '2 Kişilik',
        status: 'Available',
        features: ['TV', 'Minibar', 'Wi-Fi'],
        pricePerNight: 500,
        imageUrl: '/images/rooms/double_deluxe_3.jpg'
      },
];

const RoomStatusPage = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [activeView, setActiveView] = useState('card'); // Bu state kullanılıyor mu? Aşağıda viewMode var.
  const [roomNumberSearch, setRoomNumberSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState(null); // Başlangıçta null olabilir
  const [endDate, setEndDate] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  // Tarih string'ini ('dd.MM.yyyy' veya ISO) Date objesine çeviren yardımcı fonksiyon
  const parseDateString = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr instanceof Date) return dateStr; // Zaten Date objesi ise döndür

      try {
          // ISO formatını dene (YYYY-MM-DDTHH:mm:ssZ)
          let parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
              return parsedDate;
          }

          // 'dd.MM.yyyy' formatını dene
          const parts = dateStr.split('.');
          if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1; // Ay 0'dan başlar
              const year = parseInt(parts[2], 10);
              if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                  parsedDate = new Date(year, month, day);
                  if (!isNaN(parsedDate.getTime())) {
                     return parsedDate;
                  }
              }
          }
      } catch(e) {
          console.error("Tarih ayrıştırma hatası (parseDateString):", dateStr, e);
      }

      console.warn("Geçersiz veya tanınmayan tarih formatı:", dateStr);
      return null; // Tanınmayan formatlar için null döndür
  };

  // Backend'den gelen durum değerlerini frontend için kullanılan değerlere dönüştür
  const mapStatusFromBackend = (status) => {
      const lowerCaseStatus = status ? status.toLowerCase() : 'available';
      const statusMap = {
          'available': 'Available',
          'occupied': 'Occupied', // Backend'den gelirse
          'maintenance': 'Under Maintenance', // Backend 'Maintenance' döndürüyor
          'cleaning': 'Cleaning', // Varsa
      };
      return statusMap[lowerCaseStatus] || 'Available'; // Bilinmeyen durumlar için varsayılan
  };

  // API'den gelen özellikleri uygun formata dönüştür (Dizi döndürmeli)
  const parseFeatures = (features) => {
      if (!features) return []; // Boş veya null ise boş dizi döndür
      if (Array.isArray(features)) {
          return features; // Zaten dizi ise direkt döndür
      }
      // String gelirse (JSON veya virgülle ayrılmış olabilir)
      if (typeof features === 'string') {
          try {
              // JSON string ise parse etmeyi dene
              const parsed = JSON.parse(features);
              return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
              // Virgülle ayrılmışsa split etmeyi dene
              if (features.includes(',')) {
                  return features.split(',').map(f => f.trim()).filter(f => f);
              }
              // Tek bir özellikse diziye çevir
              return features.trim() ? [features.trim()] : [];
          }
      }
      console.warn("Beklenmedik features formatı, boş dizi döndürülüyor:", features);
      return []; // Diğer tipler için boş dizi
  };

   // Tarih formatlama (dd.MM.yyyy)
   const formatDate = (date) => {
    if (!date) return '';
    const d = parseDateString(date); // Önce Date objesine çevir
    if (!d || isNaN(d.getTime())) {
        return ''; // Geçersiz tarihse boş döndür
    }
    try {
        return d.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        console.error("Tarih formatlama hatası (formatDate):", date, e);
        return ''; // Hata durumunda boş döndür
    }
  };


  // Backend'den gerçek veri çeken fonksiyon (DÜZELTİLMİŞ)
  const loadRoomsFromBackend = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // API yanıtını alıyoruz. Bu değişken API'den dönen TÜM nesneyi tutuyor: { pageNumber: ..., data: [...] }
      const roomsData = await roomService.getAllRooms(); // Orijinal değişken adını KULLANIYORUZ

      // *** ANA DÜZELTME: roomsData NESNESİNİN İÇİNDEKİ 'data' DİZİSİNİ KULLAN ***
      // roomsData'nın ve roomsData.data'nın varlığını ve dizi olduğunu kontrol et
      if (roomsData && Array.isArray(roomsData.data)) {
        const formattedRooms = roomsData.data.map(room => { // <<< .data EKLENDİ
          // API'den gelen 'room' nesnesini frontend formatına dönüştür
          return {
             id: room.id || room._id,
             roomNumber: String(room.roomNumber) || '', // String olduğundan emin ol
             capacity: `${room.capacity || 'Bilinmiyor'} Kişilik`,
             status: mapStatusFromBackend(room.computedStatus), // API'den gelen 'computedStatus'
             features: parseFeatures(room.features), // Bu fonksiyonun dizi döndürdüğünden emin ol
             pricePerNight: room.pricePerNight || 0,
             imageUrl: room.imageUrl || null,
             // Not: API yanıtında guest yok. API dolu odalar için guest döndürmeli
             guest: room.guest ? {
                 name: room.guest.name,
                 checkInDate: formatDate(room.guest.checkInDate), // formatDate kullanılıyor
                 checkOutDate: formatDate(room.guest.checkOutDate) // formatDate kullanılıyor
              } : null,
             maintenance: room.isOnMaintenance ? { // API'deki 'isOnMaintenance' boolean değerine göre
                 issue: room.description && room.description !== 'none' ? room.description : 'Bakımda',
                 estimatedCompletionDate: 'Bilinmiyor' // API'de yoksa
             } : null,
             // Diğer bilgiler
             roomType: room.roomType,
             description: room.description,
          };
        });

        setRooms(formattedRooms);
        setFilteredRooms(formattedRooms);
      } else {
         // API'den beklenen format gelmediyse veya data dizisi yoksa
         console.error("API'den geçersiz veri yapısı alındı veya 'data' alanı bulunamadı:", roomsData);
         throw new Error('Oda verileri alınırken beklenmedik bir formatla karşılaşıldı.');
      }
      // *** DÜZELTMELER SONU ***

    } catch (err) {
      // Hata yakalama bloğu
      console.error('Odalar yüklenirken hata:', err);
      // Hata mesajını state'e kaydet (kullanıcıya göstermek için)
      const errorMessage = err.message || 'Odalar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
      setError(errorMessage);
      setRooms([]); // Hata durumunda odaları temizle
      setFilteredRooms([]);
    } finally {
      setIsLoading(false);
    }
  };


  // Backend API'dan verileri çekmek için useEffect kullan
  useEffect(() => {
    // Mock data kullanılıp kullanılmayacağını belirle (opsiyonel)
    const useMockData = process.env.REACT_APP_USE_MOCK_DATA === 'true';

    if (useMockData) {
      // Mock veri kullan (test için)
      const loadMockData = () => {
        setIsLoading(true);
        setTimeout(() => {
          setRooms(mockRooms);
          setFilteredRooms(mockRooms);
          setIsLoading(false);
        }, 500);
      };
      loadMockData();
    } else {
      // Gerçek backend API'sine bağlan
      loadRoomsFromBackend();
    }
  }, []); // Sadece component mount olduğunda çalışır


  // Filtreleme mantığı (Bu kısım API'den gelen veriye göre güncellenmeli)
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...rooms]; // Filtrelemeye başlamadan önce tüm odaları al

      // Oda Numarası Filtresi (Büyük/küçük harf duyarsız)
      if (roomNumberSearch) {
        filtered = filtered.filter(room =>
          room.roomNumber.toLowerCase().includes(roomNumberSearch.toLowerCase())
        );
      }

      // Durum Filtresi
      if (statusFilter) {
        filtered = filtered.filter(room =>
          room.status === statusFilter // Frontend formatındaki 'status' ile karşılaştır
        );
      }

      // Tarih Aralığı Filtresi (Frontend filtrelemesi sınırlıdır, backend daha iyi)
      // Bu kısım sadece 'Available' odaları veya konaklaması çakışmayan 'Occupied' odaları gösterir
      if (startDate && endDate) {
        console.warn("Tarih filtrelemesi frontend'de yapılıyor. Backend filtrelemesi önerilir.");
        const filterStart = new Date(startDate.setHours(0, 0, 0, 0));
        const filterEnd = new Date(endDate.setHours(23, 59, 59, 999));

        filtered = filtered.filter(room => {
          if (room.status === 'Available') return true; // Müsaitse her zaman göster
          if (room.status === 'Occupied' && room.guest) {
              const guestCheckIn = parseDateString(room.guest.checkInDate); // dd.MM.yyyy -> Date
              const guestCheckOut = parseDateString(room.guest.checkOutDate); // dd.MM.yyyy -> Date

              if (!guestCheckIn || !guestCheckOut) return false; // Geçersiz misafir tarihleri

              // Konaklama aralığı filtre aralığı ile çakışıyor mu?
              const overlaps = (guestCheckIn < filterEnd) && (guestCheckOut > filterStart);
              return !overlaps; // Çakışmıyorsa göster (yani oda o tarihlerde uygun)
          }
          // Diğer durumlar (Bakımda vb.) tarih filtresinden etkilenmez (şimdilik)
          if(room.status === 'Under Maintenance') return true;

          return false; // Belirsiz durumlar veya geçersiz veri
        });
      }

      // Özellik Filtresi
      if (selectedFeatures.length > 0) {
        filtered = filtered.filter(room =>
          selectedFeatures.every(feature =>
            Array.isArray(room.features) && room.features.includes(feature)
          )
        );
      }

      setFilteredRooms(filtered); // Filtrelenmiş sonuçları state'e yaz
    };

    // rooms veya filtreler değiştiğinde filtrelemeyi uygula
     if (!isLoading) { // Sadece yükleme bittikten sonra filtrele
         applyFilters();
     }
  }, [rooms, roomNumberSearch, statusFilter, startDate, endDate, selectedFeatures, isLoading]); // isLoading dependency eklendi


  const handleRefresh = () => {
    // Verileri backend'den yeniden yükle
    loadRoomsFromBackend();
  };

  const handleReserve = (room) => {
    // Rezervasyon formunu göster
    setSelectedRoom(room);
    setShowReservationForm(true);
  };

  const handleViewDetails = (room) => {
    // Detay modalını göster
    setSelectedRoom(room);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    // Detay modalını kapat
    setShowModal(false);
    setSelectedRoom(null);
  };

  const handleCloseReservationForm = () => {
    // Rezervasyon formunu kapat
    setShowReservationForm(false);
    setSelectedRoom(null);
  };

  const handleCancelReservation = async (room) => {
    // Rezervasyon iptali (API çağrısı gerekiyor)
    // Bu fonksiyonun API bağlantısı eklenmeli (roomService.cancelReservation)
    if (!room || !room.guest || !room.guest.reservationId) {
        alert('İptal edilecek geçerli bir rezervasyon bulunamadı.');
        return;
    }

    if (window.confirm(`${room.roomNumber} numaralı odanın rezervasyonunu (ID: ${room.guest.reservationId}) iptal etmek istediğinize emin misiniz?`)) {
      setIsLoading(true);
      setError(null);
      try {
        // Backend API'sini çağır (roomService.js'de tanımlanmalı)
        await roomService.cancelReservation({ reservationId: room.guest.reservationId });

        alert(`${room.roomNumber} numaralı oda rezervasyonu başarıyla iptal edildi.`);
        handleCloseModal();
        handleRefresh(); // Listeyi yenile

      } catch (err) {
        console.error('Rezervasyon iptal edilirken hata:', err.response?.data || err.message);
        const cancelError = err.response?.data?.message || 'Rezervasyon iptal edilirken bir hata oluştu.';
        setError(cancelError);
        alert(cancelError);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Rezervasyon Oluşturma (API bağlantılı)
  const handleCreateReservation = async (reservationData) => {
    if (!selectedRoom) {
      console.error("Rezervasyon için oda seçilmedi.");
      alert("Bir hata oluştu, lütfen tekrar deneyin.");
      return;
    }

    // Backend'e gönderilecek veriyi hazırla
    const payload = {
      roomId: selectedRoom.id, // Backend oda ID'sini bekler
      guestName: reservationData.fullName,
      // Tarihleri backend'in beklediği formata çevir (örn: YYYY-MM-DD)
      checkInDate: '', // Aşağıda formatlanacak
      checkOutDate: '', // Aşağıda formatlanacak
      phoneNumber: reservationData.phoneNumber || null,
      // Backend'in beklediği diğer alanlar...
    };

    // Tarih formatını backend için ayarla (YYYY-MM-DD)
    const formatDateForBackend = (dateStr) => { // dateStr 'dd.MM.yyyy' formatında
        const dateObj = parseDateString(dateStr); // Önce Date objesine çevir
        if (!dateObj) return null;
        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`; // YYYY-MM-DD formatı
    };

    payload.checkInDate = formatDateForBackend(reservationData.checkInDate);
    payload.checkOutDate = formatDateForBackend(reservationData.checkOutDate);

    if (!payload.checkInDate || !payload.checkOutDate) {
        alert('Geçersiz tarih formatı. Lütfen tarihleri kontrol edin.');
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // roomService üzerinden backend API'sini çağır
      const response = await roomService.reserveRoom(payload);

      console.log("Rezervasyon Yanıtı:", response);
      alert(`${selectedRoom.roomNumber} numaralı oda için rezervasyon başarıyla oluşturuldu.`);
      handleCloseReservationForm();
      handleRefresh(); // Oda listesini güncelle

    } catch (err) {
      console.error('Rezervasyon oluşturulurken hata:', err.response?.data || err.message);
      const createError = err.response?.data?.message || 'Rezervasyon oluşturulurken bir hata oluştu.';
      setError(createError);
      alert(createError);
    } finally {
      setIsLoading(false);
    }
  };


  const handleFeatureSelect = (feature) => {
    // Seçili özellikleri güncelle
    const updatedFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
    setSelectedFeatures(updatedFeatures);
  };


  // Yükleniyor durumu render fonksiyonu
  const renderLoading = () => (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <div className={styles.loadingText}>Odalar yükleniyor...</div>
    </div>
  );

  // Hata mesajı render fonksiyonu
  const renderError = () => (
    error && (
        <div className={styles.errorMessage}>
        <FaExclamationTriangle className={styles.errorIcon} />
        {error} {/* State'deki hata mesajını göster */}
        </div>
    )
  );

  return (
    <MainLayout title="Oda Durumu">
      <div className={styles.roomStatusPage}>
        <div className={styles.controlsContainer}>
          {/* Görünüm Seçenekleri */}
          <div className={styles.viewControls}>
            <button
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
              title="Liste Görünümü"
            >
              <FaList /> Liste Görünümü
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === 'calendar' ? styles.active : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Takvim Görünümü"
            >
              <FaCalendar /> Takvim Görünümü
            </button>
          </div>
          {/* Yenile Butonu */}
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isLoading}
            title="Oda listesini yenile"
          >
            <FaSync className={`${styles.viewIcon} ${isLoading ? styles.spinning : ''}`} /> YENİLE
          </button>
        </div>

        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Oda Durumu</h1>
        </div>

        {/* Hata Mesajı Alanı */}
        {renderError()} {/* Hata mesajını burada render et */}

        {/* Filtreleme Alanı */}
        <div className={styles.searchFilters}>
          <div className={styles.filterHeader}>
            <div className={styles.filterTitle}>Filtrele & Ara</div>
            <button
              className={styles.filtersButton}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              title="Gelişmiş filtreleri göster/gizle"
            >
              <FaFilter /> {showAdvancedFilters ? 'FİLTRELERİ GİZLE' : 'GELİŞMİŞ FİLTRELER'}
            </button>
          </div>

          {/* Temel Filtreler */}
          <div className={styles.searchInputContainer}>
            <div className={styles.inputGroup}>
              <label htmlFor="roomNumberSearch" className={styles.inputLabel}>Oda Numarası Ara</label>
              <input
                id="roomNumberSearch"
                type="text"
                className={styles.inputField}
                value={roomNumberSearch}
                onChange={(e) => setRoomNumberSearch(e.target.value)}
                placeholder="Oda No..."
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="statusFilter" className={styles.inputLabel}>Durum Filtresi</label>
              <select
                id="statusFilter"
                className={styles.selectField}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tüm Durumlar</option>
                <option value="Available">Müsait</option>
                <option value="Occupied">Dolu</option>
                <option value="Under Maintenance">Bakımda</option>
                {/* Diğer durumlar eklenebilir */}
              </select>
            </div>
          </div>

          {/* Gelişmiş Filtreler (açılır/kapanır) */}
          {showAdvancedFilters && (
            <div className={styles.advancedFilters}>
              <div className={styles.dateGroup}>
                <label className={styles.inputLabel}>Tarih Aralığı (Müsaitlik Kontrolü İçin)</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat="dd.MM.yyyy"
                    placeholderText="Başlangıç Tarihi"
                    className={styles.inputField}
                    minDate={new Date()} // Geçmiş tarih seçilemez
                    isClearable // Tarihi temizleme butonu
                  />
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate || new Date()}
                    dateFormat="dd.MM.yyyy"
                    placeholderText="Bitiş Tarihi"
                    className={styles.inputField}
                    disabled={!startDate}
                    isClearable
                  />
                </div>
                <small>Not: Tarih filtrelemesi backend ile daha doğru çalışır.</small>
              </div>
              <div className={styles.featureGroup}>
                <label className={styles.inputLabel}>Oda Özellikleri</label>
                <div className={styles.featureCheckboxGroup}>
                  {/* Özellikler dinamik olarak API'den veya sabit bir listeden alınabilir */}
                  {['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 'Jacuzzi', 'Coffee Machine'].map(feature => (
                     <label key={feature} className={styles.featureLabel}>
                        <input
                        type="checkbox"
                        checked={selectedFeatures.includes(feature)}
                        onChange={() => handleFeatureSelect(feature)}
                        /> {feature}
                     </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Oda Listesi veya Takvim Görünümü */}
        {isLoading ? (
          renderLoading() // Yükleniyor animasyonu göster
        ) : (
          // Yükleme bittiyse ve hata yoksa içeriği göster
           !error && ( // Hata yoksa render et
             <>
                {viewMode === 'list' && (
                <div className={styles.roomGrid}>
                    {filteredRooms.length > 0 ? (
                    filteredRooms.map(room => (
                        <RoomCard
                        key={room.id}
                        room={room}
                        onReserve={handleReserve}
                        onViewDetails={handleViewDetails}
                        />
                    ))
                    ) : (
                    // Hata yok ama filtre sonucu oda bulunamadıysa
                    <div className={styles.noRoomsMessage}>
                        Aradığınız kriterlere uygun oda bulunamadı.
                    </div>
                    )}
                </div>
                )}

                {viewMode === 'calendar' && (
                <CalendarView
                    rooms={rooms} // Takvim tüm odaları kullanabilir
                    onViewDetails={handleViewDetails}
                    onReserve={handleReserve}
                />
                )}
             </>
           )
        )}

        {/* Oda Detay Modalı */}
        {showModal && selectedRoom && (
          <RoomDetailModal
            room={selectedRoom}
            onClose={handleCloseModal}
            onCancelReservation={handleCancelReservation}
            onReserve={handleReserve}
          />
        )}

        {/* Rezervasyon Formu Modalı */}
        {showReservationForm && selectedRoom && (
          <ReservationForm
            room={selectedRoom}
            onClose={handleCloseReservationForm}
            onCreateReservation={handleCreateReservation}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default RoomStatusPage;