import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Input, Select, Tabs, Badge, Space, Modal, Form, InputNumber } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import './ManageRoom.css';
import roomService from '../../services/roomService';
import MaintenanceIssues from './MaintenanceIssues';

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
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentRoom, setCurrentRoom] = useState(null);
  const [form] = Form.useForm();
  
  // State for maintenance issues modal
  const [isMaintenanceModalVisible, setIsMaintenanceModalVisible] = useState(false);
  const [selectedMaintenanceRoom, setSelectedMaintenanceRoom] = useState(null);

  // Load rooms from API
  useEffect(() => {
    fetchRooms();
  }, []);

  // Manage filters
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
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRooms = () => {
    let filtered = [...rooms];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(room => 
        room.roomNumber.toString().includes(searchText) || 
        room.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Room type filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(room => room.roomType === activeTab);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(room => room.computedStatus === selectedStatus);
    }

    // Floor filter
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
      fetchRooms(); // Reload rooms
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await roomService.deleteRoom(roomId);
        fetchRooms(); // Reload rooms
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    }
  };

  const handleMaintenanceModalOpen = (room) => {
    setSelectedMaintenanceRoom(room);
    setIsMaintenanceModalVisible(true);
  };

  const handleMaintenanceModalClose = () => {
    setIsMaintenanceModalVisible(false);
  };

  // Determine status color
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

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'Available':
        return 'Available';
      case 'Occupied':
        return 'Occupied';
      case 'Maintenance':
        return 'Maintenance';
      default:
        return status;
    }
  };

  return (
    <div className="manage-room-container">
      <h1>Room Management</h1>

      {/* Room type summary cards */}
      <Row gutter={16} className="room-summary">
        <Col span={6}>
          <Card className="summary-card">
            <h3>Standard</h3>
            <div className="summary-content">
              <div>
                <div>Total</div>
                <div className="total-count">{rooms.filter(r => r.roomType === 'Standard').length}</div>
              </div>
              <div>
                <div>Available</div>
                <div className="available-count">{rooms.filter(r => r.roomType === 'Standard' && r.computedStatus === 'Available').length}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="summary-card">
            <h3>Deluxe</h3>
            <div className="summary-content">
              <div>
                <div>Total</div>
                <div className="total-count">{rooms.filter(r => r.roomType === 'Deluxe').length}</div>
              </div>
              <div>
                <div>Available</div>
                <div className="available-count">{rooms.filter(r => r.roomType === 'Deluxe' && r.computedStatus === 'Available').length}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="summary-card">
            <h3>Suite</h3>
            <div className="summary-content">
              <div>
                <div>Total</div>
                <div className="total-count">{rooms.filter(r => r.roomType === 'Suite').length}</div>
              </div>
              <div>
                <div>Available</div>
                <div className="available-count">{rooms.filter(r => r.roomType === 'Suite' && r.computedStatus === 'Available').length}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="summary-card">
            <h3>All Rooms</h3>
            <div className="summary-content">
              <div>
                <div>Total</div>
                <div className="total-count">{rooms.length}</div>
              </div>
              <div>
                <div>Available</div>
                <div className="available-count">{rooms.filter(r => r.computedStatus === 'Available').length}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <div className="filters-container">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by room number or description"
          onChange={handleSearch}
          style={{ width: 250 }}
        />
        <Select
          placeholder="Filter by status"
          style={{ width: 150 }}
          defaultValue="all"
          onChange={handleStatusChange}
        >
          <Option value="all">All Statuses</Option>
          <Option value="Available">Available</Option>
          <Option value="Occupied">Occupied</Option>
          <Option value="Maintenance">Maintenance</Option>
        </Select>
        <Select
          placeholder="Filter by floor"
          style={{ width: 120 }}
          defaultValue="all"
          onChange={handleFloorChange}
        >
          <Option value="all">All Floors</Option>
          <Option value="1">1st Floor</Option>
          <Option value="2">2nd Floor</Option>
          <Option value="3">3rd Floor</Option>
          <Option value="4">4th Floor</Option>
        </Select>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={showAddModal}
        >
          Add Room
        </Button>
      </div>

      {/* Room List */}
      <div className="room-tabs">
        <Tabs defaultActiveKey="all" onChange={handleTabChange}>
          <TabPane tab="All Rooms" key="all">
            <RoomList 
              rooms={filteredRooms} 
              loading={loading}
              onEdit={showEditModal}
              onDelete={handleDeleteRoom}
              onMaintenanceView={handleMaintenanceModalOpen}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          </TabPane>
          <TabPane tab="Standard Rooms" key="Standard">
            <RoomList 
              rooms={filteredRooms.filter(room => room.roomType === 'Standard')} 
              loading={loading}
              onEdit={showEditModal}
              onDelete={handleDeleteRoom}
              onMaintenanceView={handleMaintenanceModalOpen}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          </TabPane>
          <TabPane tab="Deluxe Rooms" key="Deluxe">
            <RoomList 
              rooms={filteredRooms.filter(room => room.roomType === 'Deluxe')} 
              loading={loading}
              onEdit={showEditModal}
              onDelete={handleDeleteRoom}
              onMaintenanceView={handleMaintenanceModalOpen}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          </TabPane>
          <TabPane tab="Suite Rooms" key="Suite">
            <RoomList 
              rooms={filteredRooms.filter(room => room.roomType === 'Suite')} 
              loading={loading}
              onEdit={showEditModal}
              onDelete={handleDeleteRoom}
              onMaintenanceView={handleMaintenanceModalOpen}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          </TabPane>
        </Tabs>
      </div>

      {/* Room Add/Edit Modal */}
      <Modal
        title={
          <span style={{ color: '#3f2b7b' }}>
            {modalMode === 'add' ? 'Add New Room' : `Edit Room: ${currentRoom?.roomNumber}`}
          </span>
        }
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleRoomSubmit}
          >
            {modalMode === 'add' ? 'Add' : 'Update'}
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="roomNumber"
            label="Room Number"
            rules={[{ required: true, message: 'Please enter a room number!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="roomType"
            label="Room Type"
            rules={[{ required: true, message: 'Please select a room type!' }]}
          >
            <Select>
              <Option value="Standard">Standard</Option>
              <Option value="Deluxe">Deluxe</Option>
              <Option value="Suite">Suite</Option>
              <Option value="Royal">Royal Suite</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="floor"
            label="Floor"
            rules={[{ required: true, message: 'Please select a floor!' }]}
          >
            <Select>
              <Option value={1}>1st Floor</Option>
              <Option value={2}>2nd Floor</Option>
              <Option value={3}>3rd Floor</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="roomCapacity"
            label="Capacity"
            rules={[{ required: true, message: 'Please select capacity!' }]}
          >
            <Select>
              <Option value="1">1 Person</Option>
              <Option value="2">2 People</Option>
              <Option value="3">3 People</Option>
              <Option value="4">4 People</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="pricePerNight"
            label="Price per Night (₺)"
            rules={[{ required: true, message: 'Please enter price per night!' }]}
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
            label="Description"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="features"
            label="Features"
          >
            <Select mode="multiple" placeholder="Select features">
              <Option value="Wi-Fi">Wi-Fi</Option>
              <Option value="TV">TV</Option>
              <Option value="Mini Bar">Mini Bar</Option>
              <Option value="Air Conditioning">Air Conditioning</Option>
              <Option value="Balcony">Balcony</Option>
              <Option value="Jacuzzi">Jacuzzi</Option>
              <Option value="Coffee Machine">Coffee Machine</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Maintenance Issues Modal */}
      {selectedMaintenanceRoom && (
        <MaintenanceIssues
          visible={isMaintenanceModalVisible}
          onClose={handleMaintenanceModalClose}
          room={selectedMaintenanceRoom}
        />
      )}
    </div>
  );
};

// Room list component
const RoomList = ({ rooms, loading, onEdit, onDelete, onMaintenanceView, getStatusColor, getStatusText }) => {
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
                <InfoCircleOutlined key="view" onClick={() => onMaintenanceView(room)} />
              ]}
            >
              <div className="card-header">
                <h3>Room {room.roomNumber}</h3>
                <Badge 
                  status={getStatusColor(room.computedStatus)} 
                  text={getStatusText(room.computedStatus)}
                />
              </div>
              <div className="card-content">
                <p>{room.roomType} - {room.capacity} {room.capacity === 1 ? 'Person' : 'People'} - {room.floor}{room.floor === 1 ? 'st' : room.floor === 2 ? 'nd' : room.floor === 3 ? 'rd' : 'th'} Floor</p>
                <div className="price">{room.pricePerNight} ₺ / Night</div>
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