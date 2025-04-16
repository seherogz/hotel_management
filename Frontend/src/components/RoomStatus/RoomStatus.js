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

// Mock data for rooms
const mockRooms = [
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
      // API URL'yi çevre değişkeninden al
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
      
      // Backend API'den oda verilerini çek
      const response = await fetch(`${apiUrl}/rooms`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch rooms from server');
      }
      
      const roomsData = await response.json();
      
      // Backend'den gelen verileri frontend formatına dönüştür
      const formattedRooms = roomsData.map(room => {
        // Burada API'den gelen veriyi frontend'in ihtiyaç duyduğu formata dönüştür
        return {
          id: room.id,
          roomNumber: room.roomNumber || '',
          capacity: `${room.capacity || '2'} Kişilik`,
          status: mapStatusFromBackend(room.status),
          features: parseFeatures(room.features),
          pricePerNight: room.pricePerNight || 0,
          // Eğer API'den bir imageUrl gelirse onu kullan, yoksa RoomCard içinde varsayılan resim üretilecek
          imageUrl: room.imageUrl || null,
          guest: room.guest ? {
            name: room.guest.name,
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
      console.error('Error fetching rooms:', err);
      setError('Odalar yüklenirken bir hata oluştu. Test verileri gösteriliyor.');
      // Hata durumunda mock verileri kullan
      setRooms(mockRooms);
      setFilteredRooms(mockRooms);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Backend'den gelen durum değerlerini frontend için kullanılan değerlere dönüştür
  const mapStatusFromBackend = (status) => {
    const statusMap = {
      'available': 'Available',
      'occupied': 'Occupied',
      'maintenance': 'Under Maintenance',
      // Diğer olası durumlar için burada haritalandırma ekleyebilirsiniz
    };
    return statusMap[status] || 'Available';
  };
  
  // API'den gelen özellikleri uygun formata dönüştür
  const parseFeatures = (features) => {
    if (!features) return ['TV', 'Minibar', 'Wi-Fi'];
    
    // Eğer features bir string ise JSON olarak parse et
    if (typeof features === 'string') {
      try {
        return JSON.parse(features);
      } catch (e) {
        // Parse edilemezse virgülle ayrılmış string olarak kabul et
        return features.split(',').map(f => f.trim());
      }
    }
    
    // Zaten dizi ise direkt döndür
    if (Array.isArray(features)) {
      return features;
    }
    
    return ['TV', 'Minibar', 'Wi-Fi'];
  };

  // Apply filters when any filter changes
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...rooms];

      // Room number filter
      if (roomNumberSearch) {
        filtered = filtered.filter(room => 
          room.roomNumber.includes(roomNumberSearch)
        );
      }

      // Status filter
      if (statusFilter) {
        filtered = filtered.filter(room => 
          room.status === statusFilter
        );
      }

      // Date range filter (would need to convert dates to compare)
      if (startDate && endDate) {
        // This is a simplification - in a real app, you'd need to check
        // if the room is available between these dates
        filtered = filtered.filter(room => 
          room.status !== 'Occupied' || 
          !room.guest || 
          (new Date(room.guest.checkOutDate) <= startDate || 
           new Date(room.guest.checkInDate) >= endDate)
        );
      }

      // Features filter
      if (selectedFeatures.length > 0) {
        filtered = filtered.filter(room => 
          selectedFeatures.every(feature => 
            room.features.includes(feature)
          )
        );
      }

      setFilteredRooms(filtered);
    };

    applyFilters();
  }, [rooms, roomNumberSearch, statusFilter, startDate, endDate, selectedFeatures]);

  const handleRefresh = () => {
    setIsLoading(true);
    
    // Gerçek API kullanımına geç
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

  const handleCancelReservation = (room) => {
    // API'ye iptal isteği gönderilebilir
    if (window.confirm(`${room.roomNumber} numaralı odanın rezervasyonunu iptal etmek istediğinize emin misiniz?`)) {
      // Burada gerçek API çağrısı olacak
      // Şimdilik mock verileri güncelliyoruz
      const updatedRooms = rooms.map(r => {
        if (r.id === room.id) {
          return {
            ...r,
            status: 'Available',
            guest: null
          };
        }
        return r;
      });
      
      setRooms(updatedRooms);
      setFilteredRooms(updatedRooms.filter(r => {
        // Mevcut filtreleri uygula
        if (roomNumberSearch && !r.roomNumber.includes(roomNumberSearch)) return false;
        if (statusFilter && r.status !== statusFilter) return false;
        // Diğer filtreler de burada uygulanabilir
        return true;
      }));
      
      alert(`${room.roomNumber} numaralı oda rezervasyonu iptal edildi.`);
      handleCloseModal();
    }
  };

  const handleCreateReservation = (reservationData) => {
    // Burada gerçek API çağrısı olacak
    // Şimdilik mock verileri güncelliyoruz
    if (selectedRoom) {
      // Odanın durumunu ve misafir bilgilerini güncelle
      const updatedRooms = rooms.map(r => {
        if (r.id === selectedRoom.id) {
          return {
            ...r,
            status: 'Occupied',
            guest: {
              name: reservationData.fullName,
              checkInDate: reservationData.checkInDate,
              checkOutDate: reservationData.checkOutDate,
              reservationId: reservationData.reservationId,
              phoneNumber: reservationData.phoneNumber || ''
            }
          };
        }
        return r;
      });
      
      // Güncellenmiş oda listesini state'e kaydet
      setRooms(updatedRooms);
      
      // Filtrelenmiş oda listesini de güncelle
      const newFilteredRooms = updatedRooms.filter(r => {
        // Mevcut filtreleri uygula
        if (roomNumberSearch && !r.roomNumber.includes(roomNumberSearch)) return false;
        if (statusFilter && r.status !== statusFilter) return false;
        // Diğer filtreler
        if (selectedFeatures.length > 0 && !selectedFeatures.every(f => r.features.includes(f))) return false;
        
        return true;
      });
      
      setFilteredRooms(newFilteredRooms);
      
      // Kullanıcıya bilgi ver
      alert(`${selectedRoom.roomNumber} numaralı oda için rezervasyon başarıyla oluşturuldu.`);
      
      // Rezervasyon formunu kapat
      handleCloseReservationForm();
      
      // Verilerin güncellendiğinden emin olmak için zorunlu yenileme
      setTimeout(() => {
        console.log("Odalar güncellendi:", updatedRooms);
        console.log("Filtrelenmiş odalar:", newFilteredRooms);
      }, 100);
    }
  };

  const handleFeatureSelect = (feature) => {
    const updatedFeatures = selectedFeatures.includes(feature) 
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
    
    setSelectedFeatures(updatedFeatures);
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return date; // Geçerli bir tarih değilse olduğu gibi döndür
    
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
    <div className={styles.errorMessage}>
      <FaExclamationTriangle className={styles.errorIcon} />
      {error}
    </div>
  );

  return (
    <MainLayout title="Room Status">
      <div className={styles.roomStatusPage}>
        <div className={styles.controlsContainer}>
          <div className={styles.viewControls}>
            <button 
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FaList /> List View
            </button>
            <button 
              className={`${styles.viewButton} ${viewMode === 'calendar' ? styles.active : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <FaCalendar /> Calendar View
            </button>
          </div>
          <button 
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <FaSync className={`${styles.viewIcon} ${isLoading ? styles.spinning : ''}`} /> YENİLE
          </button>
        </div>

        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Oda Durumu</h1>
        </div>

        {error && renderError()}

        <div className={styles.searchFilters}>
          <div className={styles.filterHeader}>
            <div className={styles.filterTitle}>Gelişmiş Filtreler</div>
            <button 
              className={styles.filtersButton}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <FaFilter /> GELİŞMİŞ FİLTRELER
            </button>
          </div>

          <div className={styles.searchInputContainer}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Oda Numarası Ara</label>
              <input 
                type="text" 
                className={styles.inputField}
                value={roomNumberSearch}
                onChange={(e) => setRoomNumberSearch(e.target.value)}
                placeholder="Oda numarası girin..."
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Durum Filtresi</label>
              <select 
                className={styles.selectField}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tümü</option>
                <option value="Available">Müsait</option>
                <option value="Occupied">Dolu</option>
                <option value="Under Maintenance">Bakımda</option>
              </select>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className={styles.advancedFilters}>
              <div className={styles.dateGroup}>
                <label className={styles.inputLabel}>Tarih Aralığı</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat="dd.MM.yyyy"
                    placeholderText="Başlangıç Tarihi"
                    className={styles.inputField}
                  />
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    dateFormat="dd.MM.yyyy"
                    placeholderText="Bitiş Tarihi"
                    className={styles.inputField}
                  />
                </div>
              </div>
              <div className={styles.featureGroup}>
                <label className={styles.inputLabel}>Oda Özellikleri</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={selectedFeatures.includes('TV')}
                      onChange={() => handleFeatureSelect('TV')}
                    /> TV
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={selectedFeatures.includes('Minibar')}
                      onChange={() => handleFeatureSelect('Minibar')}
                    /> Minibar
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={selectedFeatures.includes('Wi-Fi')}
                      onChange={() => handleFeatureSelect('Wi-Fi')}
                    /> Wi-Fi
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          renderLoading()
        ) : (
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
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 0' }}>
                    No rooms match your search criteria.
                  </div>
                )}
              </div>
            )}

            {viewMode === 'calendar' && (
              <CalendarView rooms={filteredRooms} onViewDetails={handleViewDetails} />
            )}
          </>
        )}

        {/* Oda Detay Modalı */}
        {showModal && (
          <RoomDetailModal 
            room={selectedRoom} 
            onClose={handleCloseModal}
            onCancelReservation={handleCancelReservation}
            onReserve={handleReserve}
          />
        )}

        {/* Rezervasyon Formu */}
        {showReservationForm && (
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