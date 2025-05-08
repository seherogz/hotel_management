import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Input, Select, Tabs, Badge, Space, Modal, Form, InputNumber } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import './ManageRoom.css';
import roomService from '../../services/roomService';

const { Option } = Select;
const { TabPane } = Tabs;

const ManageRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' veya 'edit'
  const [currentRoom, setCurrentRoom] = useState(null);
  const [form] = Form.useForm();

  // Odaları API'den yükle
  useEffect(() => {
    fetchRooms();
  }, []);

  // Filtrelemeleri yönet
  useEffect(() => {
    filterRooms();
  }, [rooms, searchText, activeTab, selectedStatus, selectedFloor]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getAllRooms();
      setRooms(response.data);
      setFilteredRooms(response.data);
    } catch (error) {
      console.error('Odalar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRooms = () => {
    let filtered = [...rooms];

    // Arama filtresi
    if (searchText) {
      filtered = filtered.filter(room => 
        room.roomNumber.toString().includes(searchText) || 
        room.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Oda tipi filtresi
    if (activeTab !== 'all') {
      filtered = filtered.filter(room => room.roomType === activeTab);
    }

    // Durum filtresi
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(room => room.computedStatus === selectedStatus);
    }

    // Kat filtresi
    if (selectedFloor !== 'all') {
      filtered = filtered.filter(room => room.floor.toString() === selectedFloor);
    }

    setFilteredRooms(filtered);
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
  };

  const handleFloorChange = (value) => {
    setSelectedFloor(value);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const showAddModal = () => {
    setModalMode('add');
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (room) => {
    setModalMode('edit');
    setCurrentRoom(room);
    form.setFieldsValue({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      floor: room.floor,
      roomCapacity: room.capacity,
      pricePerNight: room.pricePerNight,
      description: room.description,
      features: room.features
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleRoomSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (modalMode === 'add') {
        await roomService.createRoom(values);
      } else {
        await roomService.updateRoom(currentRoom.id, values);
      }
      
      setIsModalVisible(false);
      fetchRooms(); // Odaları yeniden yükle
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Bu odayı silmek istediğinizden emin misiniz?')) {
      try {
        await roomService.deleteRoom(roomId);
        fetchRooms(); // Odaları yeniden yükle
      } catch (error) {
        console.error('Oda silinirken hata:', error);
      }
    }
  };

  // Durum rengini belirle
  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'success';
      case 'Occupied':
        return 'error';
      case 'Maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Durum Turkish çevirisi
  const getStatusText = (status) => {
    switch (status) {
      case 'Available':
        return 'Hazır';
      case 'Occupied':
        return 'Dolu';
      case 'Maintenance':
        return 'Bakımda';
      default:
        return status;
    }
  };

  return (
    <div className="manage-room-container">
      <h1>Oda Yönetimi</h1>

      {/* Oda tipleri özet kartları */}
      <Row gutter={16} className="room-summary">
        <Col span={6}>
          <Card className="summary-card">
            <h3>Standart</h3>
            <div className="summary-content">
              <div>
                <div>Toplam</div>
                <div className="total-count">{rooms.filter(r => r.roomType === 'Standard').length}</div>
              </div>
              <div>
                <div>Müsait</div>
                <div className="available-count">
                  {rooms.filter(r => r.roomType === 'Standard' && r.computedStatus === 'Available').length}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="summary-card">
            <h3>Delüks</h3>
            <div className="summary-content">
              <div>
                <div>Toplam</div>
                <div className="total-count">{rooms.filter(r => r.roomType === 'Deluxe').length}</div>
              </div>
              <div>
                <div>Müsait</div>
                <div className="available-count">
                  {rooms.filter(r => r.roomType === 'Deluxe' && r.computedStatus === 'Available').length}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="summary-card">
            <h3>Süit</h3>
            <div className="summary-content">
              <div>
                <div>Toplam</div>
                <div className="total-count">{rooms.filter(r => r.roomType === 'Suite').length}</div>
              </div>
              <div>
                <div>Müsait</div>
                <div className="available-count">
                  {rooms.filter(r => r.roomType === 'Suite' && r.computedStatus === 'Available').length}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="summary-card">
            <h3>Kral Dairesi</h3>
            <div className="summary-content">
              <div>
                <div>Toplam</div>
                <div className="total-count">{rooms.filter(r => r.roomType === 'Royal').length || 0}</div>
              </div>
              <div>
                <div>Müsait</div>
                <div className="available-count">
                  {rooms.filter(r => r.roomType === 'Royal' && r.computedStatus === 'Available').length || 0}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Arama ve filtreler */}
      <div className="filters-container">
        <Input
          placeholder="Oda ara..."
          prefix={<SearchOutlined />}
          onChange={handleSearch}
          style={{ width: 200 }}
        />
        <Select 
          defaultValue="all" 
          style={{ width: 150 }} 
          onChange={handleStatusChange}
        >
          <Option value="all">Tüm Durumlar</Option>
          <Option value="Available">Hazır</Option>
          <Option value="Occupied">Dolu</Option>
          <Option value="Maintenance">Bakımda</Option>
        </Select>
        <Select 
          defaultValue="all" 
          style={{ width: 120 }} 
          onChange={handleFloorChange}
        >
          <Option value="all">Tüm Katlar</Option>
          <Option value="1">1. Kat</Option>
          <Option value="2">2. Kat</Option>
          <Option value="3">3. Kat</Option>
        </Select>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={showAddModal}
        >
          YENİ ODA
        </Button>
      </div>

      {/* Tabs ve Oda Listesi */}
      <Tabs defaultActiveKey="all" onChange={handleTabChange} className="room-tabs">
        <TabPane tab="Tüm Odalar" key="all">
          <RoomList 
            rooms={filteredRooms} 
            loading={loading} 
            onEdit={showEditModal} 
            onDelete={handleDeleteRoom}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        </TabPane>
        <TabPane tab="Standart" key="Standard">
          <RoomList 
            rooms={filteredRooms} 
            loading={loading} 
            onEdit={showEditModal} 
            onDelete={handleDeleteRoom}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        </TabPane>
        <TabPane tab="Delüks" key="Deluxe">
          <RoomList 
            rooms={filteredRooms} 
            loading={loading} 
            onEdit={showEditModal} 
            onDelete={handleDeleteRoom}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        </TabPane>
        <TabPane tab="Süit" key="Suite">
          <RoomList 
            rooms={filteredRooms} 
            loading={loading} 
            onEdit={showEditModal} 
            onDelete={handleDeleteRoom}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        </TabPane>
      </Tabs>

      {/* Oda Ekleme/Düzenleme Modal */}
      <Modal
        title={modalMode === 'add' ? 'Yeni Oda Ekle' : 'Odayı Düzenle'}
        visible={isModalVisible}
        onOk={handleRoomSubmit}
        onCancel={handleCancel}
        okText={modalMode === 'add' ? 'Ekle' : 'Güncelle'}
        cancelText="İptal"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="roomNumber"
            label="Oda Numarası"
            rules={[{ required: true, message: 'Lütfen oda numarası girin!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="roomType"
            label="Oda Tipi"
            rules={[{ required: true, message: 'Lütfen oda tipi seçin!' }]}
          >
            <Select>
              <Option value="Standard">Standart</Option>
              <Option value="Deluxe">Delüks</Option>
              <Option value="Suite">Süit</Option>
              <Option value="Royal">Kral Dairesi</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="floor"
            label="Kat"
            rules={[{ required: true, message: 'Lütfen kat seçin!' }]}
          >
            <Select>
              <Option value={1}>1. Kat</Option>
              <Option value={2}>2. Kat</Option>
              <Option value={3}>3. Kat</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="roomCapacity"
            label="Kapasite"
            rules={[{ required: true, message: 'Lütfen kapasite seçin!' }]}
          >
            <Select>
              <Option value="1">1 Kişilik</Option>
              <Option value="2">2 Kişilik</Option>
              <Option value="3">3 Kişilik</Option>
              <Option value="4">4 Kişilik</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="pricePerNight"
            label="Gecelik Ücret (₺)"
            rules={[{ required: true, message: 'Lütfen gecelik ücreti girin!' }]}
          >
            <InputNumber 
              formatter={value => `₺ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\₺\s?|(,*)/g, '')}
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="Açıklama"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="features"
            label="Özellikler"
          >
            <Select mode="multiple" placeholder="Özellikleri seçin">
              <Option value="Wi-Fi">Wi-Fi</Option>
              <Option value="TV">TV</Option>
              <Option value="Mini Bar">Minibar</Option>
              <Option value="Air Conditioning">Klima</Option>
              <Option value="Balcony">Balkon</Option>
              <Option value="Jacuzzi">Jakuzi</Option>
              <Option value="Coffee Machine">Kahve Makinesi</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Oda listesi alt bileşeni
const RoomList = ({ rooms, loading, onEdit, onDelete, getStatusColor, getStatusText }) => {
  return (
    <div className="room-list">
      <Row gutter={[16, 16]}>
        {rooms.map(room => (
          <Col xs={24} sm={12} md={8} lg={8} key={room.id}>
            <Card 
              className="room-card"
              actions={[
                <EditOutlined key="edit" onClick={() => onEdit(room)} />,
                <DeleteOutlined key="delete" onClick={() => onDelete(room.id)} />,
                <InfoCircleOutlined key="view" />
              ]}
            >
              <div className="card-header">
                <h3>Oda {room.roomNumber}</h3>
                <Badge 
                  status={getStatusColor(room.computedStatus)} 
                  text={getStatusText(room.computedStatus)}
                />
              </div>
              <div className="card-content">
                <p>{room.roomType === 'Standard' ? 'Standart' : 
                    room.roomType === 'Deluxe' ? 'Delüks' : 
                    room.roomType === 'Suite' ? 'Süit' : 'Kral Dairesi'} - {room.capacity} Kişilik - {room.floor}. Kat</p>
                <div className="price">{room.pricePerNight} ₺ / Gece</div>
                <div className="room-features">
                  <Space wrap>
                    {room.features && room.features.map((feature, idx) => (
                      <span key={idx} className="feature-tag">{feature}</span>
                    ))}
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ManageRoom; 