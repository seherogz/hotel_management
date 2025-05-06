import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { customerService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function CustomerInfoScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCustomerData, setEditingCustomerData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    status: 'Standard',
    nationality: '',
    idNumber: '',
    notes: '',
    birthDate: '',
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 15;

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = customers.filter(customer => 
        (customer.FullName?.toLowerCase().includes(lowerCaseQuery) ||
        customer.Email?.toLowerCase().includes(lowerCaseQuery) ||
        customer.Phone?.includes(searchQuery) || // Phone might not need lowercasing
        customer.id?.toString().includes(searchQuery))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) setRefreshing(true);
      if (!shouldRefresh) setLoading(true);
  
      const response = await customerService.getAllCustomers(pageNum, pageSize);
      console.log('Raw API Response:', JSON.stringify(response, null, 2));
  
      const customerData = (response?.data || []).map(c => ({
        ...c,
        FullName: c.fullName || 'Unknown',
        Phone: c.phone || 'No phone',
        Email: c.email || 'No email',
        Status: c.status || 'Standart',
      }));
  
      if (shouldRefresh || pageNum === 1) {
        setCustomers(customerData);
      } else {
        setCustomers(prevCustomers => [...prevCustomers, ...customerData]);
      }
  
      setHasMore(customerData.length === pageSize);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Failed to load customers');
      Alert.alert('Error', 'Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchCustomers(1, true);
  };

  const loadMoreCustomers = () => {
    if (hasMore && !loading && !searchQuery) {
      fetchCustomers(page + 1);
    }
  };

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    // Use first and last part for initials
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarColor = (id) => {
    const colors = ['#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', 
                   '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', 
                   '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];
    
    // Use customer ID to pick a consistent color
    const colorIndex = typeof id === 'number' ? id % colors.length : 0;
    return colors[colorIndex];
  };

  const getFullName = (customer) => {
    // Use the FullName field directly from the API response
    return customer?.FullName || 'Unknown';
  };

  const viewCustomerDetails = async (customer) => {
    try {
      setIsEditing(false);
      setDetailModalVisible(true);
      setSelectedCustomer(customer); // Set initial data from list to show something immediately
      
      // Fetch detailed customer information
      const detailedCustomer = await customerService.getCustomerById(customer.id);
      console.log('Detailed customer data:', detailedCustomer);
      
      // Map the detailed data to our format
      const mappedDetailedCustomer = {
        ...detailedCustomer,
        id: detailedCustomer.id,
        FullName: detailedCustomer.fullName || 'Unknown',
        Phone: detailedCustomer.phone || 'No phone',
        Email: detailedCustomer.email || 'No email',
        Address: detailedCustomer.address || 'No address provided',
        Status: detailedCustomer.status || 'Standart',
        reservations: detailedCustomer.reservations || [],
        nationality: detailedCustomer.nationality,
        idNumber: detailedCustomer.idNumber,
        notes: detailedCustomer.notes,
        birthDate: detailedCustomer.birthDate
      };
      
      // Update state with detailed data
      setSelectedCustomer(mappedDetailedCustomer);
      setEditingCustomerData(mappedDetailedCustomer);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      Alert.alert("Error", "Failed to load customer details. Please try again.");
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!customerId) return;

    console.log(`[handleDeleteCustomer] Attempting direct delete for ID: ${customerId}`);
    setIsDeleting(true);
    try {
      console.log(`[handleDeleteCustomer] Calling customerService.deleteCustomer...`);
      await customerService.deleteCustomer(customerId);
      console.log(`[handleDeleteCustomer] customerService.deleteCustomer finished.`);
      Alert.alert("Success", "Customer deleted successfully.");
      
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      setFilteredCustomers(prev => prev.filter(c => c.id !== customerId));
      
      setDetailModalVisible(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      Alert.alert("Error", error.message || "Failed to delete customer.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomerData || !editingCustomerData.id) {
        Alert.alert("Error", "No customer data to update.");
        return;
    }

    if (!editingCustomerData.FullName || !editingCustomerData.Email || !editingCustomerData.Phone) {
      Alert.alert("Validation Error", "Name, Email, and Phone cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      const nameParts = editingCustomerData.FullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const payload = {
        id: editingCustomerData.id,
        firstName: firstName,
        lastName: lastName,
        email: editingCustomerData.Email,
        phone: editingCustomerData.Phone,
        address: editingCustomerData.Address || '', 
        status: editingCustomerData.Status,
        nationality: editingCustomerData.nationality || '',
        idNumber: editingCustomerData.idNumber || '',
        notes: editingCustomerData.notes || '',
        birthDate: editingCustomerData.birthDate || new Date().toISOString(),
      };

      await customerService.updateCustomer(editingCustomerData.id, payload);
      Alert.alert("Success", "Customer updated successfully.");

      const updatedCustomerForState = {
          ...selectedCustomer,
          ...editingCustomerData,
          FullName: editingCustomerData.FullName 
      };

      const updateList = (list) => list.map(c => c.id === editingCustomerData.id ? updatedCustomerForState : c);
      setCustomers(updateList);
      setFilteredCustomers(updateList);

      setSelectedCustomer(updatedCustomerForState);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating customer:', error);
      Alert.alert("Error", error.message || "Failed to update customer.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditInputChange = (field, value) => {
    setEditingCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddInputChange = (field, value) => {
    setNewCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCustomer = async () => {
    if (!newCustomerData.firstName || !newCustomerData.lastName || !newCustomerData.email || !newCustomerData.phone || !newCustomerData.status) {
      Alert.alert("Validation Error", "First Name, Last Name, Email, Phone, and Status are required.");
      return;
    }

    setIsAdding(true);
    try {
      // Format birthDate: Attempt to parse and convert to ISO string, send null if invalid/empty
      let formattedBirthDate = null;
      if (newCustomerData.birthDate) {
        const date = new Date(newCustomerData.birthDate);
        // Check if the date is valid after parsing
        if (!isNaN(date.getTime())) {
            formattedBirthDate = date.toISOString();
        }
        else {
            console.warn('Invalid Birth Date entered, sending null'); 
            // Optional: Alert the user about invalid date format
            // Alert.alert("Warning", "Invalid Birth Date format. Please use YYYY-MM-DD.");
        }
      }

      // Prepare payload, mapping empty strings to null for optional fields
      const payload = {
          firstName: newCustomerData.firstName,
          lastName: newCustomerData.lastName,
          email: newCustomerData.email,
          phone: newCustomerData.phone,
          address: newCustomerData.address || null,
          status: newCustomerData.status, // Assuming backend accepts 'Standard' or 'VIP'
          nationality: newCustomerData.nationality || null,
          idNumber: newCustomerData.idNumber || null,
          notes: newCustomerData.notes || null,
          birthDate: formattedBirthDate 
      };

      console.log('Sending payload:', JSON.stringify(payload, null, 2)); // Log the payload being sent

      await customerService.createCustomer(payload);
      Alert.alert("Success", "Customer added successfully.");
      setAddModalVisible(false);
      setNewCustomerData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          status: 'Standard', // Reset status to corrected default
          nationality: '',
          idNumber: '',
          notes: '',
          birthDate: '',
      });
      fetchCustomers(1, true);
    } catch (error) {
      console.error('Error adding customer:', error);
      Alert.alert("Error", error.message || "Failed to add customer.");
    } finally {
      setIsAdding(false);
    }
  };

  const renderCustomerItem = ({ item }) => {
    const customerName = getFullName(item);
    const customerPhone = item.Phone || 'No phone';
    const customerEmail = item.Email || 'No email';
    const customerId = item.id?.toString() || '';
    const avatarColor = getAvatarColor(item.id);
    const customerStatus = item.Status === 'VIP' ? 'VIP' : 'Standart';
    const isVip = customerStatus === 'VIP';
    
    console.log('Customer data:', { 
      FullName: item.FullName, 
      Phone: item.Phone,
      Email: item.Email,
      Status: item.Status,
      id: item.id,
      displayName: customerName
    });
    
    return (
      <View style={styles.customerRow}>
        <View style={styles.customerMain}>
          <View style={[styles.customerAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>
              {getInitials(customerName)}
            </Text>
          </View>
          
          <View style={styles.customerInfo}>
            <View style={styles.nameSection}>
              <Text style={styles.customerName}>{customerName}</Text>
            </View>
            
            <View style={styles.contactSection}>
              <Text style={styles.contactText}>
                {customerPhone}
              </Text>
              <Text style={styles.contactText}>
                {customerEmail}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.customerActions}>
          <View style={[styles.statusBadge, { 
            backgroundColor: isVip ? '#FF5252' : '#F5F5F5',
            borderColor: isVip ? '#FF5252' : '#DDDDDD'
          }]}>
            <Text style={[styles.statusText, { 
              color: isVip ? '#FFFFFF' : '#555555' 
            }]}>{customerStatus}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => viewCustomerDetails(item)}
          >
            <Text style={styles.detailsButtonText}>DETAYLAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCustomerDetailModal = () => {
    if (!selectedCustomer) return null;
    
    const displayData = isEditing ? editingCustomerData : selectedCustomer;

    const customerName = getFullName(displayData);
    const customerPhone = displayData.Phone || (isEditing ? '' : 'No phone number provided');
    const customerEmail = displayData.Email || (isEditing ? '' : 'No email provided');
    const customerAddress = displayData.Address || (isEditing ? '' : 'No address provided');
    const customerStatus = displayData.Status || 'Standart';
    const isVip = customerStatus === 'VIP';
    
    // Format date to be more readable if exists
    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
      } catch (e) {
        return dateString;
      }
    };

    // Format reservation date to strip time part
    const formatReservationDate = (dateString) => {
      if (!dateString) return '';
      try {
        // If dateString looks like a date format with time part
        if (dateString.includes('T') || dateString.includes('Z') || dateString.includes(':')) {
          // Handle ISO format with T separator
          if (dateString.includes('T')) {
            return dateString.split('T')[0];
          }
          
          // Handle date format with spaces and time
          if (dateString.includes(' ') && dateString.includes(':')) {
            return dateString.split(' ')[0];
          }
          
          // If it's another format, try to parse it and return just the date part
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
        
        // For date formats like 2025-05-01T15:00:00Z or 2025-05-01 15:00:00Z
        if (dateString.match(/^\d{4}-\d{2}-\d{2}[T ]/)) {
          return dateString.substring(0, 10);
        }
        
        return dateString;
      } catch (e) {
        console.log('Error formatting date:', e);
        return dateString;
      }
    };

    return (
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
            setDetailModalVisible(false);
            setIsEditing(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Customer' : 'Customer Details'}</Text>
              <TouchableOpacity onPress={() => {
                  setDetailModalVisible(false);
                  setIsEditing(false);
              }}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.customerDetailHeader}>
                 <View style={[styles.detailAvatar, { backgroundColor: getAvatarColor(displayData.id) }]}>
                   <Text style={styles.detailAvatarText}>{getInitials(customerName)}</Text>
                 </View>
                 <View style={styles.customerDetailInfo}>
                  {isEditing ? (
                    <TextInput 
                      style={[styles.detailName, styles.editInput]} 
                      value={customerName} 
                      onChangeText={(text) => handleEditInputChange('FullName', text)}
                      placeholder="Full Name"
                    />
                  ) : (
                    <Text style={styles.detailName}>{customerName}</Text>
                  )}
                  <View style={[styles.statusBadge, { 
                      backgroundColor: isVip ? '#FF5252' : '#F5F5F5',
                      borderColor: isVip ? '#FF5252' : '#DDDDDD'
                    }]}>
                      <Text style={[styles.statusText, { 
                        color: isVip ? '#FFFFFF' : '#555555' 
                      }]}>{customerStatus}</Text>
                    </View>
                 </View>
               </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <View style={styles.detailItem}>
                  <MaterialIcons name="phone" size={20} color="#666" />
                  {isEditing ? (
                    <TextInput 
                      style={[styles.detailText, styles.editInput]} 
                      value={customerPhone} 
                      onChangeText={(text) => handleEditInputChange('Phone', text)}
                      placeholder="Phone Number"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.detailText}>{customerPhone}</Text>
                  )}
                </View>
                <View style={styles.detailItem}>
                  <MaterialIcons name="email" size={20} color="#666" />
                  {isEditing ? (
                    <TextInput 
                      style={[styles.detailText, styles.editInput]} 
                      value={customerEmail} 
                      onChangeText={(text) => handleEditInputChange('Email', text)}
                      placeholder="Email Address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  ) : (
                    <Text style={styles.detailText}>{customerEmail}</Text>
                  )}
                </View>
                <View style={styles.detailItem}>
                  <MaterialIcons name="location-on" size={20} color="#666" />
                   {isEditing ? (
                    <TextInput 
                      style={[styles.detailText, styles.editInput]} 
                      value={customerAddress} 
                      onChangeText={(text) => handleEditInputChange('Address', text)}
                      placeholder="Address"
                    />
                  ) : (
                    <Text style={styles.detailText}>{customerAddress}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <View style={styles.detailItem}>
                  <MaterialIcons name="flag" size={20} color="#666" />
                  {isEditing ? (
                    <TextInput 
                      style={[styles.detailText, styles.editInput]} 
                      value={displayData.nationality || ''} 
                      onChangeText={(text) => handleEditInputChange('nationality', text)}
                      placeholder="Nationality"
                    />
                  ) : (
                    <Text style={styles.detailText}>Nationality: {displayData.nationality || 'Not provided'}</Text>
                  )}
                </View>
                <View style={styles.detailItem}>
                  <MaterialIcons name="credit-card" size={20} color="#666" />
                  {isEditing ? (
                    <TextInput 
                      style={[styles.detailText, styles.editInput]} 
                      value={displayData.idNumber || ''} 
                      onChangeText={(text) => handleEditInputChange('idNumber', text)}
                      placeholder="ID Number"
                    />
                  ) : (
                    <Text style={styles.detailText}>ID Number: {displayData.idNumber || 'Not provided'}</Text>
                  )}
                </View>
                <View style={styles.detailItem}>
                  <MaterialIcons name="cake" size={20} color="#666" />
                  {isEditing ? (
                    <TextInput 
                      style={[styles.detailText, styles.editInput]} 
                      value={displayData.birthDate ? formatDate(displayData.birthDate) : ''} 
                      onChangeText={(text) => handleEditInputChange('birthDate', text)}
                      placeholder="Birth Date (YYYY-MM-DD)"
                    />
                  ) : (
                    <Text style={styles.detailText}>Birth Date: {displayData.birthDate ? formatDate(displayData.birthDate) : 'Not provided'}</Text>
                  )}
                </View>
                <View style={styles.detailItem}>
                  <MaterialIcons name="note" size={20} color="#666" />
                  {isEditing ? (
                    <TextInput 
                      style={[styles.detailText, styles.editInput, { height: 80 }]} 
                      value={displayData.notes || ''} 
                      onChangeText={(text) => handleEditInputChange('notes', text)}
                      placeholder="Notes"
                      multiline
                    />
                  ) : (
                    <Text style={styles.detailText}>Notes: {displayData.notes || 'No notes'}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Reservation History</Text>
                {(displayData.reservations && displayData.reservations.length > 0) ? (
                  displayData.reservations.map((reservation, index) => {
                    // For debugging field names
                    console.log('Reservation data:', JSON.stringify(reservation, null, 2));
                    
                    return (
                    <View key={index} style={styles.reservationItem}>
                      <View style={styles.reservationHeader}>
                        <Text style={styles.reservationDate}>
                          {formatReservationDate(reservation.startDate || reservation.checkInDate)} - {formatReservationDate(reservation.endDate || reservation.checkOutDate)}
                        </Text>
                        <Text style={[styles.reservationStatus, 
                          {color: reservation.status === 'Checked-In' ? '#FF9800' : 
                                  reservation.status === 'Completed' ? '#4CAF50' : 
                                  reservation.status === 'Pending' ? '#2196F3' : 
                                  reservation.status === 'Cancelled' ? '#F44336' : '#4CAF50',
                           backgroundColor: reservation.status === 'Checked-In' ? '#FFF3E0' : 
                                           reservation.status === 'Completed' ? '#E8F5E9' : 
                                           reservation.status === 'Pending' ? '#E3F2FD' : 
                                           reservation.status === 'Cancelled' ? '#FFEBEE' : '#E8F5E9',
                           paddingHorizontal: 8,
                           paddingVertical: 4,
                           borderRadius: 12,
                           overflow: 'hidden',
                          }]}>
                          {reservation.status || 'Completed'}
                        </Text>
                      </View>
                      
                      <View style={styles.reservationContentBox}>
                        <View style={styles.reservationRoomRow}>
                          <MaterialIcons name="hotel" size={18} color="#6B3DC9" />
                          <Text style={styles.reservationRoom}>
                            {reservation.roomNumber || reservation.roomId || 'N/A'}
                            {reservation.roomType ? ` (${reservation.roomType})` : ''}
                          </Text>
                        </View>
                        
                        {((reservation.status === 'Checked-In' || reservation.status === 'Completed')) && (
                          <View style={styles.reservationDetailsDivider}>
                            <View style={styles.detailWithIcon}>
                              <MaterialIcons name="people" size={18} color="#6B3DC9" />
                              <Text style={styles.reservationGuests}>
                                2 guests
                              </Text>
                            </View>
                            
                            {reservation.price !== undefined && (
                              <View style={styles.detailWithIcon}>
                                <MaterialIcons name="attach-money" size={18} color="#6B3DC9" />
                                <Text style={styles.reservationPrice}>
                                  ${reservation.price}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                  })
                ) : (
                  <Text style={styles.noDataText}>No reservation history</Text>
                )}
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                 <View style={styles.detailItem}>
                   <MaterialIcons name="person" size={20} color="#666" />
                   <Text style={styles.detailText}> 
                     ID: {displayData.id ? `Internal ID: ${displayData.id}` : 'N/A'}
                   </Text>
                 </View>
              </View>
              
              <View style={styles.actionButtons}>
                {isEditing ? (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#FFA000' }]}
                      onPress={() => {
                          setIsEditing(false);
                          setEditingCustomerData({...selectedCustomer, FullName: getFullName(selectedCustomer)});
                      }}
                      disabled={isSaving}
                    >
                      <MaterialIcons name="cancel" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={handleUpdateCustomer}
                      disabled={isSaving}
                    >
                      <MaterialIcons name="save" size={20} color="white" />
                      <Text style={styles.actionButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => setIsEditing(true)}
                    >
                      <MaterialIcons name="edit" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                      onPress={() => handleDeleteCustomer(selectedCustomer?.id)}
                      disabled={isDeleting}
                    >
                      <MaterialIcons name="delete" size={20} color="white" />
                      <Text style={styles.actionButtonText}>{isDeleting ? 'Deleting...' : 'Delete'}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAddCustomerModal = () => {
    return (
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter first name"
                  value={newCustomerData.firstName}
                  onChangeText={(text) => handleAddInputChange('firstName', text)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter last name"
                  value={newCustomerData.lastName}
                  onChangeText={(text) => handleAddInputChange('lastName', text)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  value={newCustomerData.email}
                  onChangeText={(text) => handleAddInputChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  value={newCustomerData.phone}
                  onChangeText={(text) => handleAddInputChange('phone', text)}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter address"
                  value={newCustomerData.address}
                  onChangeText={(text) => handleAddInputChange('address', text)}
                />
              </View>
              <View style={styles.inputGroup}>
                 <Text style={styles.inputLabel}>Status *</Text>
                 <TextInput
                   style={styles.input}
                   placeholder="VIP or Standard"
                   value={newCustomerData.status}
                   onChangeText={(text) => handleAddInputChange('status', text)}
                 />
               </View>
               <View style={styles.inputGroup}>
                 <Text style={styles.inputLabel}>Nationality</Text>
                 <TextInput
                   style={styles.input}
                   placeholder="Enter nationality"
                   value={newCustomerData.nationality}
                   onChangeText={(text) => handleAddInputChange('nationality', text)}
                 />
               </View>
               <View style={styles.inputGroup}>
                 <Text style={styles.inputLabel}>ID Number</Text>
                 <TextInput
                   style={styles.input}
                   placeholder="Enter ID number"
                   value={newCustomerData.idNumber}
                   onChangeText={(text) => handleAddInputChange('idNumber', text)}
                 />
               </View>
               <View style={styles.inputGroup}>
                 <Text style={styles.inputLabel}>Notes</Text>
                 <TextInput
                   style={[styles.input, { height: 80 }]}
                   placeholder="Enter notes"
                   value={newCustomerData.notes}
                   onChangeText={(text) => handleAddInputChange('notes', text)}
                   multiline
                 />
               </View>
               <View style={styles.inputGroup}>
                 <Text style={styles.inputLabel}>Birth Date</Text>
                 <TextInput
                   style={styles.input}
                   placeholder="YYYY-MM-DD"
                   value={newCustomerData.birthDate}
                   onChangeText={(text) => handleAddInputChange('birthDate', text)}
                 />
               </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#FFA000' }]} 
                  onPress={() => setAddModalVisible(false)}
                  disabled={isAdding}
                >
                  <MaterialIcons name="cancel" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleAddCustomer}
                  disabled={isAdding}
                >
                  <MaterialIcons name="add" size={20} color="white" />
                  <Text style={styles.actionButtonText}>{isAdding ? 'Adding...' : 'Add Customer'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Müşteri Bilgileri</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Müşteri Ara (İsim, E-posta, Telefon, Adres, TC Kimlik)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={24} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      <Text style={styles.sectionTitle}>Müşteri Listesi</Text>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchCustomers(1)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6B3DC9" />
              <Text style={styles.loadingText}>Loading customers...</Text>
            </View>
          ) : filteredCustomers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No customers match your search' : 'No customers found'}
              </Text>
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>Clear search</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={styles.tableContainer}>
              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={renderCustomerItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={['#6B3DC9']}
                  />
                }
                onEndReached={loadMoreCustomers}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                  hasMore && !searchQuery ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color="#6B3DC9" />
                      <Text style={styles.footerText}>Loading more...</Text>
                    </View>
                  ) : null
                }
              />
            </View>
          )}
        </>
      )}
      
      {renderCustomerDetailModal()}
      {renderAddCustomerModal()}
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
            setNewCustomerData({ 
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                address: '',
                status: 'Standard',
                nationality: '',
                idNumber: '',
                notes: '',
                birthDate: '',
             });
            setAddModalVisible(true);
        }}
      >
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  customerMain: {
    flexDirection: 'row',
    flex: 3,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  customerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameSection: {
    marginBottom: 5,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contactSection: {
    
  },
  contactText: {
    fontSize: 14,
    color: '#666',
  },
  customerActions: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  clearSearchText: {
    color: '#6B3DC9',
    fontSize: 16,
    marginTop: 15,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    flexGrow: 1,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6B3DC9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 15,
  },
  customerDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailAvatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  customerDetailInfo: {
    flex: 1,
  },
  detailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  editInput: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 5,
    fontSize: 15,
    color: '#555',
    flex: 1,
    marginLeft: 10,
  },
  detailSection: {
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 15,
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  noDataText: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  reservationItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6B3DC9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reservationDate: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  reservationStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  reservationContentBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 10,
  },
  reservationRoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reservationRoom: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    fontWeight: '500',
  },
  reservationDetailsDivider: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  reservationDetails: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  reservationPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
    marginRight: 20,
  },
  reservationGuests: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginLeft: 4,
    marginRight: 20,
  },
  detailWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 0.48,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
}); 