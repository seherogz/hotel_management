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
import { fetchRooms, fetchAvailableRooms, cancelReservation } from './apiService';

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
      // API'den odaları çek
      const roomsData = await fetchRooms();
      
      if (roomsData.error) {
        throw new Error(roomsData.error);
      }
      
      // API'den gelen verileri frontend formatına dönüştür
      const formattedRooms = mapRoomsFromApi(roomsData.data || roomsData);
      
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
  
  // Backend'den tarih aralığına göre müsait odaları çeken fonksiyon
  const loadAvailableRoomsForDates = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const roomsData = await fetchAvailableRooms(startDate, endDate);
      
      if (roomsData.error) {
        throw new Error(roomsData.error);
      }
      
      const formattedRooms = mapRoomsFromApi(roomsData.data || roomsData);
      
      setRooms(formattedRooms);
      setFilteredRooms(formattedRooms);
    } catch (err) {
      console.error('Error fetching available rooms:', err);
      setError('Müsait odaları yüklerken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // API'den gelen oda verilerini frontend formatına dönüştür
  const mapRoomsFromApi = (roomsData) => {
    if (!roomsData || !Array.isArray(roomsData)) return [];
    
    return roomsData.map(room => ({
      id: room.id,
      roomNumber: room.roomNumber?.toString() || '',
      capacity: `${room.capacity || '2'} Kişilik`,
      status: determineRoomStatus(room),
      features: parseFeatures(room.amenities || room.features),
      pricePerNight: room.pricePerNight || 0,
      imageUrl: room.imageUrl || null,
      guest: room.currentReservation ? {
        name: room.currentReservation.customerName || 
              (room.currentReservation.customer ? 
                `${room.currentReservation.customer.firstName} ${room.currentReservation.customer.lastName}` : ''),
        checkInDate: formatDate(room.currentReservation.startDate),
        checkOutDate: formatDate(room.currentReservation.endDate),
        reservationId: room.currentReservation.id
      } : null,
      maintenance: room.maintenanceIssue ? {
        issue: room.maintenanceIssue.issueDescription || 'Bakım',
        estimatedCompletionDate: formatDate(room.maintenanceIssue.estimatedCompletionDate)
      } : null
    }));
  };
  
  // Odanın durumunu belirleme
  const determineRoomStatus = (room) => {
    if (room.isOnMaintenance) {
      return 'Under Maintenance';
    } else if (room.status === 'occupied' || room.currentReservation) {
      return 'Occupied';
    } else {
      return 'Available';
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
      return features.map(f => typeof f === 'object' ? f.name : f);
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
        // If dates are selected, trigger API call to get available rooms
        loadAvailableRoomsForDates();
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
  }, [rooms, roomNumberSearch, statusFilter, selectedFeatures]);

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

  const handleCancelReservation = async (room) => {
    // Send cancellation request to API
    if (window.confirm(`${room.roomNumber} numaralı odanın rezervasyonunu iptal etmek istediğinize emin misiniz?`)) {
      try {
        setIsLoading(true);
        
        // Get reservation ID from room data
        const reservationId = room.guest?.reservationId;
        
        if (!reservationId) {
          throw new Error('Rezervasyon ID bulunamadı');
        }
        
        // Call API to cancel reservation
        await cancelReservation(reservationId);
        
        // Update local state
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
        
        // Apply current filters
        const newFilteredRooms = updatedRooms.filter(r => {
          // Apply current filters
          if (roomNumberSearch && !r.roomNumber.includes(roomNumberSearch)) return false;
          if (statusFilter && r.status !== statusFilter) return false;
          // Other filters can be applied here
          return true;
        });
        
        setFilteredRooms(newFilteredRooms);
        
        alert(`${room.roomNumber} numaralı oda rezervasyonu iptal edildi.`);
        handleCloseModal();
      } catch (error) {
        console.error('Rezervasyon iptal edilirken hata:', error);
        alert(`Hata: ${error.message || 'Rezervasyon iptal edilemedi'}`);
      } finally {
        setIsLoading(false);
      }
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
      
      // Verilerin güncellendiğinden emin olmak için backend'den yeniden yükle
      handleRefresh();
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
          <div className={styles.statusLegend}>
            <div className={styles.statusItem}>
              <span className={`${styles.statusDot} ${styles.available}`}></span> Müsait
            </div>
            <div className={styles.statusItem}>
              <span className={`${styles.statusDot} ${styles.occupied}`}></span> Dolu
            </div>
            <div className={styles.statusItem}>
              <span className={`${styles.statusDot} ${styles.maintenance}`}></span> Bakımda
            </div>
          </div>
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
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default RoomStatusPage; 