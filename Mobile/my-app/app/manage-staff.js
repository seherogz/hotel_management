import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, FlatList, ScrollView, Modal, Switch, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { staffService } from '../services/api';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const DEPARTMENTS = [
  { key: 'all', label: 'All' },
  { key: 'front_office', label: 'Front Office' },
  { key: 'housekeeping', label: 'Housekeeping' },
  { key: 'other', label: 'Other Departments' },
];

const STATUS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const TABS = [
  { key: 'home', label: 'Ana Sayfa', icon: 'home', route: '/home' },
  { key: 'staff', label: 'Personel', icon: 'groups', route: '/manage-staff' },
  { key: 'rooms', label: 'Odalar', icon: 'hotel', route: '/rooms' },
  { key: 'accounting', label: 'Muhasebe', icon: 'attach-money', route: '/accounting' },
  { key: 'profile', label: 'Profil', icon: 'person', route: '/profile' },
];

const DEPARTMENTS_MODAL = [
  { key: 'front_office', label: 'Front Office', icon: 'business-center' },
  { key: 'housekeeping', label: 'Housekeeping', icon: 'cleaning-services' },
  { key: 'kitchen', label: 'Kitchen', icon: 'restaurant' },
  { key: 'security', label: 'Security', icon: 'security' },
  { key: 'finance', label: 'Finance', icon: 'attach-money' },
  { key: 'technical', label: 'Technical', icon: 'build' },
  { key: 'other', label: 'Other', icon: 'more-horiz' },
];

export default function ManageStaffScreen() {
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [activeTabBar, setActiveTabBar] = useState('staff');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, [status, activeTab, search]);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (status !== 'all') filters.status = status;
      if (activeTab !== 'all') filters.department = activeTab;
      if (search) filters.search = search;
      const response = await staffService.getAllStaff(1, 50, filters);
      
      // API'den dönen verinin tamamını görelim
      console.log('API Staff Response:', response);
      
      // İlk personel objesini detaylı görelim (varsa)
      if (response.data && response.data.length > 0) {
        console.log('İlk personel detayı:', JSON.stringify(response.data[0], null, 2));
        console.log('Maaş alanları kontrol:', {
          salary: response.data[0].salary,
          Salary: response.data[0].Salary,
          maaş: response.data[0].maaş,
          pay: response.data[0].pay,
          wage: response.data[0].wage
        });
      }
      
      setStaff(response.data || []);
    } catch (err) {
      console.error('Staff fetch error:', err);
      setError('Veriler alınamadı.');
    }
    setLoading(false);
  };

  const filteredStaff = staff.filter((person) => {
    const matchesSearch = (person.firstName && person.lastName ? `${person.firstName} ${person.lastName}` : person.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      status === 'all' ||
      (status === 'active' && person.status === 'Active') ||
      (status === 'inactive' && person.status === 'Inactive');
    const matchesDepartment = department === 'all' || person.department === department || person.Department === department;
    const matchesTab = activeTab === 'all' || person.department === activeTab || person.Department === activeTab;
    return matchesSearch && matchesStatus && matchesDepartment && matchesTab;
  });

  const renderStaffCard = ({ item }) => {
    const isActive = item.status === 'Active';
    console.log('Kart verisi:', item);
    return (
      <View style={styles.card}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{((item.firstName && item.lastName) ? `${item.firstName[0]}${item.lastName[0]}` : (item.name ? item.name.split(' ').map(n => n[0]).join('') : '')).toLowerCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.staffName}>{item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : item.name}</Text>
          <Text style={styles.staffRole}>{item.role} ({item.department || item.Department})</Text>
          <Text style={styles.staffInfo}>Department: {item.department || item.Department}</Text>
          <Text style={styles.staffInfo}>Start Date: {(item.startDate || item.StartDate)?.slice(0, 10)}</Text>
          <Text style={styles.staffInfo}>Email: {item.email || item.Email}</Text>
          <Text style={styles.staffInfo}>Phone: {item.phoneNumber || item.PhoneNumber}</Text>
          <Text style={styles.staffInfo}>Salary: <Text style={{ fontWeight: 'bold', color: '#16A085' }}>{item.salary || '0'} TL</Text></Text>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={isActive ? styles.statusActive : styles.statusInactive}>
            <Text style={styles.statusText}>{isActive ? 'Active' : 'Inactive'}</Text>
          </View>
          <TouchableOpacity style={styles.detailsButton} onPress={() => { setSelectedStaff(item); setDetailsModalVisible(true); }}>
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleTabPress = (tab) => {
    setActiveTabBar(tab.key);
    if (tab.route !== '/manage-staff') router.push(tab.route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Personel Yönetimi</Text>
        </View>
        <View style={{ width: 24 }} /> {/* Sağda boşluk bırakmak için */}
      </View>
      <View style={styles.filters}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Personel ara..."
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.newStaffButtonModern} onPress={() => setModalVisible(true)}>
            <MaterialIcons name="person-add" size={22} color="#fff" />
            <Text style={styles.newStaffButtonText}>New Staff</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {DEPARTMENTS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={activeTab === tab.key ? styles.activeTabText : styles.tabText}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
          {STATUS.map(s => (
            <TouchableOpacity
              key={s.key}
              style={[styles.statusTab, status === s.key && styles.activeStatusTab]}
              onPress={() => setStatus(s.key)}
            >
              <Text style={status === s.key ? styles.activeStatusText : styles.statusText}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#3C3169" />
        ) : error ? (
          <Text style={{ color: 'red' }}>{error}</Text>
        ) : (
          <FlatList
            data={filteredStaff}
            keyExtractor={item => item.id.toString()}
            renderItem={renderStaffCard}
            ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666', marginTop: 40 }}>Personel bulunamadı.</Text>}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabBarItem}
            onPress={() => handleTabPress(tab)}
          >
            <MaterialIcons name={tab.icon} size={28} color={activeTabBar === tab.key ? '#3C3169' : '#aaa'} />
            <Text style={[styles.tabBarLabel, activeTabBar === tab.key && { color: '#3C3169', fontWeight: 'bold' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <CreateStaffModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreated={fetchStaff} />
      <StaffDetailsModal
        visible={detailsModalVisible}
        staff={selectedStaff}
        onClose={() => setDetailsModalVisible(false)}
        onUpdated={fetchStaff}
        onDeleted={fetchStaff}
      />
    </SafeAreaView>
  );
}

function CreateStaffModal({ visible, onClose, onCreated }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS_MODAL[0].key);
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [salary, setSalary] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [departmentModal, setDepartmentModal] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setError(null);
    if (!firstName || !lastName || !department || !role || !startDate || !email || !phoneNumber || salary === '') {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    try {
      const staffData = {
        FirstName: firstName,
        LastName: lastName,
        Department: department,
        Role: role,
        StartDate: startDate.toISOString(),
        Email: email,
        PhoneNumber: phoneNumber,
        Salary: Number(salary),
        IsActive: isActive,
      };
      console.log('Gönderilen veri:', staffData);
      await staffService.createStaff(staffData);
      setLoading(false);
      onCreated && onCreated();
      onClose();
    } catch (err) {
      setError('Kayıt başarısız.');
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainerModern}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Staff</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <MaterialIcons name="close" size={24} color="#3C3169" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Personal Info Card */}
            <View style={styles.modalCard}>
              <Text style={styles.modalSectionModern}><MaterialIcons name="person" size={18} color="#6B3DC9" />  Personal Information</Text>
              <View style={styles.modalRowModern}>
                <View style={styles.modalInputIconBox}>
                  <MaterialIcons name="person" size={20} color="#aaa" style={styles.modalInputIcon} />
                  <TextInput style={styles.modalInputModern} placeholder="First Name *" value={firstName} onChangeText={setFirstName} />
                </View>
                <View style={styles.modalInputIconBox}>
                  <MaterialIcons name="person" size={20} color="#aaa" style={styles.modalInputIcon} />
                  <TextInput style={styles.modalInputModern} placeholder="Last Name *" value={lastName} onChangeText={setLastName} />
                </View>
              </View>
              <View style={styles.modalRowModern}>
                <View style={styles.modalInputIconBox}>
                  <MaterialIcons name="email" size={20} color="#aaa" style={styles.modalInputIcon} />
                  <TextInput style={styles.modalInputModern} placeholder="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" />
                </View>
                <View style={styles.modalInputIconBox}>
                  <MaterialIcons name="phone" size={20} color="#aaa" style={styles.modalInputIcon} />
                  <TextInput style={styles.modalInputModern} placeholder="Phone Number *" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
                </View>
              </View>
            </View>
            {/* Employment Info Card */}
            <View style={styles.modalCard}>
              <Text style={styles.modalSectionModern}><MaterialIcons name="work" size={18} color="#6B3DC9" />  Employment Information</Text>
              <View style={styles.modalRowModern}>
                {/* Department Modal Trigger */}
                <TouchableOpacity style={styles.modalInputIconBox} onPress={() => setDepartmentModal(true)}>
                  <MaterialIcons name={DEPARTMENTS_MODAL.find(d => d.key === department)?.icon || 'business-center'} size={20} color="#aaa" style={styles.modalInputIcon} />
                  <Text style={[styles.modalInputModern, { color: department ? '#333' : '#aaa' }]}>{DEPARTMENTS_MODAL.find(d => d.key === department)?.label || 'Select Department *'}</Text>
                  <MaterialIcons name={'expand-more'} size={20} color="#aaa" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <View style={styles.modalInputIconBox}>
                  <MaterialIcons name="badge" size={20} color="#aaa" style={styles.modalInputIcon} />
                  <TextInput style={styles.modalInputModern} placeholder="Role/Position *" value={role} onChangeText={setRole} />
                </View>
              </View>
              <View style={styles.modalRowModern}>
                <TouchableOpacity style={styles.modalInputIconBox} onPress={() => setDatePickerVisible(true)}>
                  <MaterialIcons name="event" size={20} color="#aaa" style={styles.modalInputIcon} />
                  <Text style={[styles.modalInputModern, { color: startDate ? '#333' : '#aaa', paddingTop: 2 }]}>{startDate ? startDate.toLocaleDateString() : 'Start Date *'}</Text>
                </TouchableOpacity>
                <View style={styles.modalInputIconBox}>
                  <MaterialIcons name="attach-money" size={20} color="#aaa" style={styles.modalInputIcon} />
                  <TextInput style={styles.modalInputModern} placeholder="Salary *" value={salary} onChangeText={setSalary} keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.modalRowModern}>
                <View style={styles.modalSwitchRow}>
                  <Text style={{ fontWeight: 'bold', color: isActive ? '#16A085' : '#aaa', marginRight: 8 }}>{isActive ? 'Active' : 'Inactive'}</Text>
                  <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: '#16A085', false: '#aaa' }} />
                </View>
              </View>
            </View>
            {error && <Text style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>{error}</Text>}
            <View style={styles.modalButtonRowModern}>
              <TouchableOpacity style={styles.modalCancelModern} onPress={onClose}><Text style={styles.modalCancelTextModern}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveModern} onPress={handleSave} disabled={loading}>
                <Text style={styles.modalSaveTextModern}>{loading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          {/* Department Modal */}
          <Modal visible={departmentModal} transparent animationType="fade">
            <TouchableOpacity style={styles.departmentModalOverlay} activeOpacity={1} onPress={() => setDepartmentModal(false)}>
              <View style={styles.departmentModalBox}>
                {DEPARTMENTS_MODAL.map(opt => (
                  <TouchableOpacity key={opt.key} style={styles.departmentModalItem} onPress={() => { setDepartment(opt.key); setDepartmentModal(false); }}>
                    <MaterialIcons name={opt.icon} size={20} color="#6B3DC9" style={{ marginRight: 10 }} />
                    <Text style={{ color: '#3C3169', fontWeight: 'bold', fontSize: 16 }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
          {/* Date Picker Modal */}
          <DateTimePickerModal
            isVisible={datePickerVisible}
            mode="date"
            onConfirm={date => { setDatePickerVisible(false); if (date) setStartDate(date); }}
            onCancel={() => setDatePickerVisible(false)}
            date={startDate}
          />
        </View>
      </View>
    </Modal>
  );
}

function StaffDetailsModal({ visible, staff, onClose, onUpdated, onDeleted }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  useEffect(() => {
    if (staff) {
      console.log('Detay görünümüne gelen personel verisi:', JSON.stringify(staff, null, 2));
      setForm({ ...staff });
      setEditMode(false);
      setError(null);
    }
  }, [staff, visible]);

  if (!staff) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ad ve soyadı ayır
      const fullName = form.name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Maaş değerini kontrol et
      const salaryValue = form.salary || form.Salary || 0;
      console.log('Güncelleme için kullanılan maaş değeri:', salaryValue);

      // Backend'in beklediği alan adlarıyla veri oluştur
      const updatedStaff = {
        id: form.id,
        FirstName: firstName,
        LastName: lastName,
        Department: form.department,
        Role: form.position || form.role,
        StartDate: form.startDate,
        Email: form.email,
        PhoneNumber: form.phoneNumber,
        Salary: Number(salaryValue),
        IsActive: form.status === 'Active'
      };
      
      console.log('Güncellenecek veri:', updatedStaff);
      await staffService.updateStaff(form.id, updatedStaff);
      setEditMode(false);
      onUpdated && onUpdated();
    } catch (err) {
      setError('Update failed.');
      console.log('Update error:', err?.response?.data || err.message || err);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirmVisible) {
      setDeleteConfirmVisible(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Silinecek personel ID:', staff.id);
      await staffService.deleteStaff(staff.id);
      console.log('Silme başarılı!');
      onDeleted && onDeleted();
      onClose();
    } catch (err) {
      console.error('Silme hatası:', err);
      setError('Delete failed. ' + (err.message || ''));
      setDeleteConfirmVisible(false);
    }
    setLoading(false);
  };

  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.detailsModalContainer, { width: '92%', maxHeight: '92%' }]}> 
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Staff Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <MaterialIcons name="close" size={24} color="#3C3169" />
            </TouchableOpacity>
          </View>
          {error && <Text style={styles.detailsError}>{error}</Text>}
          <ScrollView>
            {/* Avatar & Name */}
            <View style={styles.detailsAvatarBlock}>
              <View style={styles.detailsAvatarCircle}>
                <Text style={styles.detailsAvatarText}>{(staff.name ? staff.name.split(' ').map(n => n[0]).join('') : (staff.firstName && staff.lastName ? `${staff.firstName[0]}${staff.lastName[0]}` : '')).toLowerCase()}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <View style={staff.status === 'Active' ? styles.statusActive : styles.statusInactive}>
                  <Text style={styles.statusText}>{staff.status === 'Active' ? 'Active' : 'Inactive'}</Text>
                </View>
                <Text style={styles.detailsName}>{staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`}</Text>
              </View>
              <Text style={styles.detailsPosition}>{staff.position || staff.role}</Text>
            </View>
            {/* Info Sections */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsSection}><MaterialIcons name="info" size={20} color="#6B3DC9" />  Basic Information</Text>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Staff ID:</Text><Text style={styles.detailsValue}>{staff.id}</Text></View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Email:</Text>{editMode ? <TextInput value={form.email} onChangeText={v => handleChange('email', v)} style={styles.detailsInput} /> : <Text style={styles.detailsValue}>{staff.email}</Text>}</View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Phone:</Text>{editMode ? <TextInput value={form.phoneNumber} onChangeText={v => handleChange('phoneNumber', v)} style={styles.detailsInput} /> : <Text style={styles.detailsValue}>{staff.phoneNumber}</Text>}</View>
            </View>
            <View style={styles.detailsCard}>
              <Text style={styles.detailsSection}><MaterialIcons name="work" size={20} color="#6B3DC9" />  Employment Information</Text>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Department:</Text>{editMode ? <TextInput value={form.department} onChangeText={v => handleChange('department', v)} style={styles.detailsInput} /> : <Text style={styles.detailsValue}>{staff.department}</Text>}</View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Start Date:</Text>{editMode ? <TextInput value={form.startDate} onChangeText={v => handleChange('startDate', v)} style={styles.detailsInput} /> : <Text style={styles.detailsValue}>{(staff.startDate || '').slice(0, 10)}</Text>}</View>
              <View style={styles.detailsRow}><Text style={styles.detailsLabel}>Position/Role:</Text>{editMode ? <TextInput value={form.position || form.role} onChangeText={v => handleChange('position', v)} style={styles.detailsInput} /> : <Text style={styles.detailsValue}>{staff.position || staff.role}</Text>}</View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Salary:</Text>
                {editMode ? (
                  <TextInput 
                    value={String(form.salary || '')} 
                    onChangeText={v => handleChange('salary', v)} 
                    style={styles.detailsInput} 
                    keyboardType="numeric" 
                  />
                ) : (
                  <Text style={[styles.detailsValue, { fontWeight: 'bold', color: '#16A085' }]}>
                    {staff.salary ? `${staff.salary} TL` : '0 TL'}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.detailsButtonRow}>
              {editMode ? (
                <>
                  <TouchableOpacity style={styles.detailsCancelBtn} onPress={() => setEditMode(false)}><Text style={styles.detailsCancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.detailsSaveBtn} onPress={handleUpdate} disabled={loading}>
                    <Text style={styles.detailsSaveText}>{loading ? 'Saving...' : 'Save'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {deleteConfirmVisible ? (
                    <View style={styles.deleteConfirmBox}>
                      <Text style={styles.deleteConfirmText}>Are you sure you want to delete this staff?</Text>
                      <View style={styles.deleteConfirmButtons}>
                        <TouchableOpacity style={[styles.detailsCancelBtn, {marginRight: 10}]} onPress={cancelDelete}>
                          <Text style={styles.detailsCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.detailsDeleteBtn]} onPress={handleDelete}>
                          <MaterialIcons name="delete-forever" size={20} color="#fff" />
                          <Text style={styles.detailsDeleteText}>Confirm Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.detailsEditBtn} onPress={() => setEditMode(true)}>
                        <MaterialIcons name="edit" size={20} color="#fff" />
                        <Text style={styles.detailsEditText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.detailsDeleteBtn} onPress={handleDelete}>
                        <MaterialIcons name="delete" size={20} color="#fff" />
                        <Text style={styles.detailsDeleteText}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3C3169',
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    padding: 5,
  },
  filters: {
    padding: 15,
    backgroundColor: '#fff',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#3C3169',
  },
  tabText: {
    color: '#3C3169',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusFilters: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statusTab: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  activeStatusTab: {
    backgroundColor: '#16A085',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  activeStatusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3C3169',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    textTransform: 'lowercase',
  },
  staffName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  staffRole: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  staffInfo: {
    fontSize: 13,
    color: '#888',
  },
  statusActive: {
    backgroundColor: '#16A085',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  statusInactive: {
    backgroundColor: '#aaa',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  detailsButton: {
    borderWidth: 1,
    borderColor: '#3C3169',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  detailsButtonText: {
    color: '#3C3169',
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    height: 60,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabBarLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  newStaffButtonModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B3DC9',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 10,
    elevation: 2,
  },
  newStaffButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerModern: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3C3169',
  },
  modalClose: {
    padding: 5,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalSectionModern: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalRowModern: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalInputIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  modalInputIcon: {
    marginRight: 7,
  },
  modalInputModern: {
    flex: 1,
    fontSize: 17,
    color: '#333',
    paddingVertical: 4,
  },
  modalButtonRowModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCancelModern: {
    backgroundColor: '#aaa',
    borderRadius: 8,
    padding: 12,
  },
  modalCancelTextModern: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  modalSaveModern: {
    backgroundColor: '#16A085',
    borderRadius: 8,
    padding: 12,
  },
  modalSaveTextModern: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  departmentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  departmentModalBox: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  departmentModalItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailsModalContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignSelf: 'center',
  },
  detailsAvatarBlock: {
    alignItems: 'center',
    marginBottom: 18,
  },
  detailsAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3C3169',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 32,
    textTransform: 'lowercase',
  },
  detailsName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#222',
  },
  detailsPosition: {
    color: '#666',
    fontSize: 16,
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: '#f7f7fa',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  detailsSection: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B3DC9',
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsLabel: {
    fontWeight: 'bold',
    color: '#333',
    width: 120,
  },
  detailsValue: {
    color: '#444',
    fontSize: 15,
    flex: 1,
  },
  detailsInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  detailsButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  detailsEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B3DC9',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 8,
  },
  detailsEditText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
  detailsDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  detailsDeleteText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
  detailsCancelBtn: {
    backgroundColor: '#aaa',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  detailsCancelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  detailsSaveBtn: {
    backgroundColor: '#16A085',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  detailsSaveText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  detailsError: {
    color: '#e74c3c',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  deleteConfirmBox: {
    backgroundColor: '#ffefef',
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    width: '100%',
  },
  deleteConfirmText: {
    color: '#e53935',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
}); 