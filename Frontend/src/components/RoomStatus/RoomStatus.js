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
  const [activeView, setActiveView] = useState('card');
  const [roomNumberSearch, setRoomNumberSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  // Backend API'dan verileri çekmek için useEffect kullan
  useEffect(() => {
    // Test ortamında mı yoksa gerçek API'ye mi bağlanacağımızı kontrol et
    // Not: Gerçek bir projede, API'ye bağlanma mantığı daha sağlam olmalı
    // ve mock data kullanımı geliştirme/test aşamaları için olmalı.
    const useMockData = process.env.REACT_APP_USE_MOCK_DATA === 'true'; 
    
    if (useMockData) {
      // Mock veri kullan
      const loadMockData = () => {
        setIsLoading(true);
        // Simulate API delay
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
  }, []);

  // Backend'den gerçek veri çeken fonksiyon
  const loadRoomsFromBackend = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // roomService'i kullanarak odaları çek
      // Not: roomService.getAllRooms backend API endpoint'ine göre ayarlanmalıdır.
      // Eğer spesifik bir endpoint varsa (örn: /room/status) onu kullanın.
      const roomsData = await roomService.getAllRooms(); // Veya uygun olan fonksiyon
      
      // Backend'den gelen verileri frontend formatına dönüştür
      const formattedRooms = roomsData.map(room => {
        // Burada API'den gelen veriyi frontend'in ihtiyaç duyduğu formata dönüştür
        return {
          id: room.id || room._id, // Backend'in ID formatına göre ayarlayın (id veya _id)
          roomNumber: room.roomNumber || '',
          capacity: `${room.capacity || 'Bilinmiyor'} Kişilik`, // Varsayılan değer eklendi
          status: mapStatusFromBackend(room.status),
          features: parseFeatures(room.features),
          pricePerNight: room.pricePerNight || 0,
          imageUrl: room.imageUrl || null, // Varsayılan resim RoomCard'da ele alınacak
          guest: room.guest ? {
            name: room.guest.name,
            // Tarih formatlaması API'den gelen formata göre ayarlanmalı
            checkInDate: formatDate(room.guest.checkInDate), 
            checkOutDate: formatDate(room.guest.checkOutDate)
          } : null,
          maintenance: room.maintenance ? {
            issue: room.maintenance.issue,
            estimatedCompletionDate: formatDate(room.maintenance.estimatedCompletionDate)
          } : null
        };
      });
      
      setRooms(formattedRooms);
      setFilteredRooms(formattedRooms);
    } catch (err) {
      console.error('Odalar yüklenirken hata:', err);
      setError('Odalar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      // Hata durumunda belki boş liste göstermek veya mock veriye dönmek daha iyi olabilir
      setRooms([]); // Boş liste göster
      setFilteredRooms([]);
      // setRooms(mockRooms); // Alternatif: Mock verileri göster
      // setFilteredRooms(mockRooms);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Backend'den gelen durum değerlerini frontend için kullanılan değerlere dönüştür
  const mapStatusFromBackend = (status) => {
    // Backend'den gelen status değerlerini küçük harfe çevirerek karşılaştırma yap
    const lowerCaseStatus = status ? status.toLowerCase() : 'available'; // null/undefined kontrolü
    const statusMap = {
      'available': 'Available',
      'occupied': 'Occupied',
      'maintenance': 'Under Maintenance',
      'cleaning': 'Cleaning', // Örnek ek durum
      // Diğer olası durumlar için burada haritalandırma ekleyebilirsiniz
    };
    return statusMap[lowerCaseStatus] || 'Available'; // Bilinmeyen durumlar için varsayılan
  };
  
  // API'den gelen özellikleri uygun formata dönüştür
  const parseFeatures = (features) => {
    // Varsayılan boş dizi döndür
    if (!features) return []; 
    
    // Eğer features bir string ise JSON olarak parse etmeyi dene
    if (typeof features === 'string') {
      try {
        // JSON.parse güvenli değilse, daha güvenli bir ayrıştırma yöntemi kullanın
        const parsed = JSON.parse(features);
        return Array.isArray(parsed) ? parsed : features.split(',').map(f => f.trim());
      } catch (e) {
        // Parse edilemezse virgülle ayrılmış string olarak kabul et
        return features.split(',').map(f => f.trim()).filter(f => f); // Boş elemanları filtrele
      }
    }
    
    // Zaten dizi ise direkt döndür
    if (Array.isArray(features)) {
      return features;
    }
    
    // Diğer durumlar için boş dizi döndür
    return [];
  };

  // Apply filters when any filter changes
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...rooms];

      // Room number filter (Case-insensitive)
      if (roomNumberSearch) {
        filtered = filtered.filter(room => 
          room.roomNumber.toLowerCase().includes(roomNumberSearch.toLowerCase())
        );
      }

      // Status filter
      if (statusFilter) {
        filtered = filtered.filter(room => 
          room.status === statusFilter
        );
      }

      // Date range filter (Bu kısım backend'den filtrelenmiş veri istemeli)
      // Frontend'de tarih filtrelemesi karmaşık ve eksik olabilir. 
      // İdeal olarak, tarih aralığı backend'e gönderilip uygun odalar alınmalı.
      // Aşağıdaki filtreleme sadece basit bir örnektir ve tüm durumları kapsamaz.
      if (startDate && endDate) {
        console.warn("Tarih filtrelemesi frontend'de yapılıyor. Backend filtrelemesi önerilir.");
        // Örnek: Müsait odaları veya belirtilen tarih aralığı dışında kalan dolu odaları filtrele
        filtered = filtered.filter(room => {
          if (room.status === 'Available') return true; // Müsaitse her zaman göster
          if (room.status === 'Occupied' && room.guest) {
              try {
                  // Tarihleri Date objesine çevirirken hata kontrolü yap
                  const guestCheckIn = parseDateString(room.guest.checkInDate);
                  const guestCheckOut = parseDateString(room.guest.checkOutDate);
                  const filterStart = new Date(startDate.setHours(0, 0, 0, 0));
                  const filterEnd = new Date(endDate.setHours(23, 59, 59, 999));

                  if (!guestCheckIn || !guestCheckOut) return false; // Geçersiz misafir tarihleri

                  // Eğer misafirin konaklaması filtre aralığıyla çakışmıyorsa göster
                  return guestCheckOut <= filterStart || guestCheckIn >= filterEnd;
              } catch (e) {
                  console.error("Tarih ayrıştırma hatası:", e);
                  return false; // Hata durumunda gösterme
              }
          }
          return false; // Diğer durumlar (Bakımda vb.) tarih filtresinden etkilenmez
        });
      }

      // Features filter
      if (selectedFeatures.length > 0) {
        filtered = filtered.filter(room => 
          selectedFeatures.every(feature => 
            Array.isArray(room.features) && room.features.includes(feature)
          )
        );
      }

      setFilteredRooms(filtered);
    };

    applyFilters();
  }, [rooms, roomNumberSearch, statusFilter, startDate, endDate, selectedFeatures]);

  // Tarih string'ini ('dd.MM.yyyy') Date objesine çeviren yardımcı fonksiyon
  const parseDateString = (dateStr) => {
      if (!dateStr || typeof dateStr !== 'string') return null;
      const parts = dateStr.split('.');
      if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Ay 0'dan başlar
          const year = parseInt(parts[2], 10);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
              return new Date(year, month, day);
          }
      }
      // Alternatif formatları veya Date.parse'ı deneyebilirsiniz
      const parsedDate = new Date(dateStr); 
      return !isNaN(parsedDate.getTime()) ? parsedDate : null;
  };

  const handleRefresh = () => {
    // Gerçek API'den verileri yeniden yükle
    loadRoomsFromBackend();
  };

  const handleReserve = (room) => {
    // Rezervasyon formunu göster ve seçilen odayı ayarla
    setSelectedRoom(room);
    setShowReservationForm(true);
  };

  const handleViewDetails = (room) => {
    // Modalı göster ve seçilen odayı ayarla
    setSelectedRoom(room);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    // Modalı kapat
    setShowModal(false);
    setSelectedRoom(null);
  };

  const handleCloseReservationForm = () => {
    // Rezervasyon formunu kapat
    setShowReservationForm(false);
    setSelectedRoom(null);
  };

  const handleCancelReservation = async (room) => { // async yapıldı
    if (!room || !room.guest || !room.guest.reservationId) {
        alert('İptal edilecek geçerli bir rezervasyon bulunamadı.');
        return;
    }

    if (window.confirm(`${room.roomNumber} numaralı odanın rezervasyonunu (ID: ${room.guest.reservationId}) iptal etmek istediğinize emin misiniz?`)) {
      setIsLoading(true); // Yükleniyor durumunu başlat
      setError(null);
      try {
        // Backend API'sini çağır
        // Backend'in beklediği payload'ı ayarlayın (örn: sadece reservationId)
        await roomService.cancelReservation({ reservationId: room.guest.reservationId }); 

        alert(`${room.roomNumber} numaralı oda rezervasyonu başarıyla iptal edildi.`);
        handleCloseModal(); // Detay modalını kapat
        handleRefresh(); // Listeyi yenile

      } catch (err) {
        console.error('Rezervasyon iptal edilirken hata:', err);
        setError('Rezervasyon iptal edilirken bir hata oluştu. Lütfen tekrar deneyin.');
        alert('Rezervasyon iptal edilirken bir hata oluştu.');
      } finally {
        setIsLoading(false); // Yükleniyor durumunu bitir
      }
    }
  };

  // --- BACKEND BAĞLANTILI handleCreateReservation ---
  const handleCreateReservation = async (reservationData) => { // Fonksiyonu async yapın
    if (!selectedRoom) {
      console.error("Rezervasyon için oda seçilmedi.");
      alert("Bir hata oluştu, lütfen tekrar deneyin.");
      return;
    }
  
    // Backend'e gönderilecek veriyi hazırla
    const payload = {
      roomId: selectedRoom.id, // Backend'in beklediği oda ID'si alanı (örn: "60d5ecb8b48f4f001f9e8f8f")
      guestName: reservationData.fullName, // Backend'in beklediği misafir adı alanı
      checkInDate: reservationData.checkInDate, // Backend'in beklediği giriş tarihi formatı (örn: "YYYY-MM-DD" veya ISO)
      checkOutDate: reservationData.checkOutDate, // Backend'in beklediği çıkış tarihi formatı (örn: "YYYY-MM-DD" veya ISO)
      phoneNumber: reservationData.phoneNumber || null, // Backend null kabul ediyorsa
      // Backend'in beklediği diğer alanları buraya ekleyebilirsiniz (örn: email, numberOfGuests)
    };

    // Tarih formatını backend'in beklediği formata çevirme (Örnek: YYYY-MM-DD)
    const formatDateForBackend = (dateStr) => {
        if (!dateStr) return null;
        const dateObj = parseDateString(dateStr); // 'dd.MM.yyyy' -> Date objesi
        if (!dateObj) return null;
        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`; // YYYY-MM-DD formatı
    };

    payload.checkInDate = formatDateForBackend(payload.checkInDate);
    payload.checkOutDate = formatDateForBackend(payload.checkOutDate);

    // Eğer formatlama başarısız olduysa veya tarihler geçerli değilse işlemi durdur
    if (!payload.checkInDate || !payload.checkOutDate) {
        alert('Geçersiz tarih formatı. Lütfen tarihleri kontrol edin.');
        return;
    }
  
    setIsLoading(true); // Yükleniyor durumunu başlat
    setError(null); // Hata durumunu sıfırla
  
    try {
      // roomService üzerinden backend API'sini çağır
      const response = await roomService.reserveRoom(payload);
  
      // Başarılı yanıt alındıysa (Backend'den dönen yanıtı kontrol edebilirsiniz)
      console.log("Rezervasyon Yanıtı:", response); // Backend'den gelen yanıtı logla
      alert(`${selectedRoom.roomNumber} numaralı oda için rezervasyon başarıyla oluşturuldu.`);
      
      // Formu kapat
      handleCloseReservationForm();
      
      // Oda listesini güncellemek için verileri yeniden çek
      handleRefresh(); // handleRefresh fonksiyonu zaten backend'den veri çekiyor
  
    } catch (err) {
      // Hata durumunda kullanıcıyı bilgilendir
      console.error('Rezervasyon oluşturulurken hata:', err.response?.data || err.message); // Daha detaylı hata loglama
      // Backend'den gelen spesifik hata mesajını göstermeyi deneyin
      const errorMessage = err.response?.data?.message || 'Rezervasyon oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsLoading(false); // Yükleniyor durumunu bitir
    }
  };
  // --- BACKEND BAĞLANTILI handleCreateReservation SONU ---


  const handleFeatureSelect = (feature) => {
    const updatedFeatures = selectedFeatures.includes(feature) 
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
    
    setSelectedFeatures(updatedFeatures);
  };

  const formatDate = (date) => {
    // Backend'den gelen tarih formatına göre esnek olmalı
    if (!date) return '';
    
    try {
      const d = new Date(date); // ISO formatı veya Date objesi varsayımı
      if (isNaN(d.getTime())) {
         // Eğer 'dd.MM.yyyy' formatındaysa parse etmeyi dene
         const parsed = parseDateString(date); 
         if (parsed && !isNaN(parsed.getTime())) {
             return parsed.toLocaleDateString('tr-TR', {
                 day: '2-digit',
                 month: '2-digit',
                 year: 'numeric'
             });
         }
         return date; // Geçerli bir tarih değilse veya parse edilemezse olduğu gibi döndür
      }
      
      return d.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
        console.error("Tarih formatlama hatası:", date, e);
        return date; // Hata durumunda orijinal değeri döndür
    }
  };

  // Render loading spinner
  const renderLoading = () => (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <div className={styles.loadingText}>Odalar yükleniyor...</div>
    </div>
  );

  // Render error message
  const renderError = () => (
    // Hata mesajı sadece error state'i doluysa gösterilir
    error && (
        <div className={styles.errorMessage}>
        <FaExclamationTriangle className={styles.errorIcon} />
        {error}
        </div>
    )
  );

  return (
    <MainLayout title="Oda Durumu"> {/* Türkçe başlık */}
      <div className={styles.roomStatusPage}>
        <div className={styles.controlsContainer}>
          {/* Görünüm Seçenekleri */}
          <div className={styles.viewControls}>
            <button 
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
              title="Liste Görünümü" // Tooltip eklendi
            >
              <FaList /> Liste Görünümü {/* Türkçe etiket */}
            </button>
            <button 
              className={`${styles.viewButton} ${viewMode === 'calendar' ? styles.active : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Takvim Görünümü" // Tooltip eklendi
            >
              <FaCalendar /> Takvim Görünümü {/* Türkçe etiket */}
            </button>
          </div>
          {/* Yenile Butonu */}
          <button 
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isLoading}
            title="Oda listesini yenile" // Tooltip eklendi
          >
            <FaSync className={`${styles.viewIcon} ${isLoading ? styles.spinning : ''}`} /> YENİLE
          </button>
        </div>

        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Oda Durumu</h1>
        </div>

        {/* Hata Mesajı Alanı */}
        {renderError()}

        {/* Filtreleme Alanı */}
        <div className={styles.searchFilters}>
          <div className={styles.filterHeader}>
            <div className={styles.filterTitle}>Filtrele & Ara</div> {/* Başlık güncellendi */}
            <button 
              className={styles.filtersButton}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              title="Gelişmiş filtreleri göster/gizle" // Tooltip eklendi
            >
              <FaFilter /> {showAdvancedFilters ? 'FİLTRELERİ GİZLE' : 'GELİŞMİŞ FİLTRELER'}
            </button>
          </div>

          {/* Temel Filtreler */}
          <div className={styles.searchInputContainer}>
            <div className={styles.inputGroup}>
              <label htmlFor="roomNumberSearch" className={styles.inputLabel}>Oda Numarası Ara</label>
              <input 
                id="roomNumberSearch" // htmlFor ile eşleşen id
                type="text" 
                className={styles.inputField}
                value={roomNumberSearch}
                onChange={(e) => setRoomNumberSearch(e.target.value)}
                placeholder="Oda No..." // Placeholder kısaltıldı
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="statusFilter" className={styles.inputLabel}>Durum Filtresi</label>
              <select 
                id="statusFilter" // htmlFor ile eşleşen id
                className={styles.selectField}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tüm Durumlar</option> {/* Daha açıklayıcı */}
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
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}> {/* Wrap eklendi */}
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
                  />
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate || new Date()} // Başlangıçtan önceki tarih seçilemez
                    dateFormat="dd.MM.yyyy"
                    placeholderText="Bitiş Tarihi"
                    className={styles.inputField}
                    disabled={!startDate} // Başlangıç seçilmeden pasif
                  />
                </div>
                <small>Not: Tarih filtrelemesi backend ile daha doğru çalışır.</small>
              </div>
              <div className={styles.featureGroup}>
                <label className={styles.inputLabel}>Oda Özellikleri</label>
                {/* Özellikler dinamik olarak API'den alınabilir */}
                <div className={styles.featureCheckboxGroup}>
                  {['TV', 'Minibar', 'Wi-Fi', 'Klima', 'Jakuzi'].map(feature => ( // Örnek özellikler
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
          renderLoading()
        ) : (
          <>
            {viewMode === 'list' && (
              <div className={styles.roomGrid}>
                {filteredRooms.length > 0 ? (
                  filteredRooms.map(room => (
                    <RoomCard
                      key={room.id} // Benzersiz key olarak id kullanıldı
                      room={room}
                      onReserve={handleReserve}
                      onViewDetails={handleViewDetails}
                    />
                  ))
                ) : (
                  // Filtre sonucunda oda bulunamadı mesajı
                  <div className={styles.noRoomsMessage}> 
                    Aradığınız kriterlere uygun oda bulunamadı.
                  </div>
                )}
              </div>
            )}

            {viewMode === 'calendar' && (
              <CalendarView 
                 rooms={rooms} // Takvim görünümüne tüm odaları göndermek daha mantıklı olabilir
                 onViewDetails={handleViewDetails} 
                 onReserve={handleReserve} // Takvimden de rezervasyon başlatılabilir
              />
            )}
          </>
        )}

        {/* Oda Detay Modalı */}
        {showModal && selectedRoom && ( // selectedRoom null değilse göster
          <RoomDetailModal 
            room={selectedRoom} 
            onClose={handleCloseModal}
            onCancelReservation={handleCancelReservation} // İptal fonksiyonu eklendi
            onReserve={handleReserve} // Detaydan da rezervasyon başlatılabilir
          />
        )}

        {/* Rezervasyon Formu Modalı */}
        {showReservationForm && selectedRoom && ( // selectedRoom null değilse göster
          <ReservationForm
            room={selectedRoom}
            onClose={handleCloseReservationForm}
            onCreateReservation={handleCreateReservation} // Backend'e bağlanan fonksiyon
          />
        )}
      </div>
    </MainLayout>
  );
};

export default RoomStatusPage;