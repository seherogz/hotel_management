import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, TextInput } from 'react-native';
import { reservationService } from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

function formatDate(date) {
  if (!date) return '';
  return format(date, 'dd.MM.yyyy');
}

function getToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export default function CheckInScreen() {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(getToday());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchCheckIns = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await reservationService.getCheckIns({
        pageNumber: 1,
        pageSize: 20,
        checkInDate: formatDate(params.date ?? date),
        customerName: params.search ?? search,
        reservationId: params.search ?? search,
      });
      setCheckIns(data.data || []);
    } catch (err) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCheckIns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCheckIns();
  };

  const handleCheckIn = async (reservationId) => {
    try {
      setLoading(true);
      await reservationService.checkIn(reservationId);
      Alert.alert('Başarılı', 'Check-in işlemi tamamlandı.');
      fetchCheckIns();
    } catch (err) {
      Alert.alert('Hata', err.message || 'Check-in işlemi başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const onSearch = () => {
    fetchCheckIns({ search });
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      fetchCheckIns({ date: selectedDate });
    }
  };

  const renderStatus = (status) => {
    let color = '#FFA500';
    let label = status;
    if (status?.toLowerCase() === 'pending') { color = '#FFA500'; label = 'Pending'; }
    else if (status?.toLowerCase() === 'checkedin') { color = '#4CAF50'; label = 'Checked-in'; }
    else if (status?.toLowerCase() === 'cancelled') { color = '#F44336'; label = 'Cancelled'; }
    return (
      <View style={[styles.badge, { backgroundColor: color }]}> 
        <Text style={styles.badgeText}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.itemTitle}>{item.customerName || 'Müşteri Bilgisi Yok'}</Text>
        {renderStatus(item.status)}
      </View>
      <Text style={styles.itemSub}>Rez. ID: {item.reservationId || '-'}</Text>
      <Text style={styles.itemSub}>Oda: {item.roomInfo || '-'}</Text>
      <Text style={styles.itemSub}>Giriş: {item.checkInDate || '-'}</Text>
      <Text style={styles.itemSub}>Çıkış: {item.checkOutDate || '-'}</Text>
      <TouchableOpacity style={styles.actionBtn} onPress={() => handleCheckIn(item.reservationId)} disabled={item.status?.toLowerCase() !== 'pending'}>
        <Text style={styles.actionBtnText}>Check-in</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Check-In</Text>
      </View>
      <View style={styles.filtersRow}>
        <TextInput
          style={styles.input}
          placeholder="ID, Name, Room Info..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateBtnText}>{date ? formatDate(date) : 'Tarih Seç'}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
          <Text style={styles.searchBtnText}>Ara</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#3C3169" />
        ) : error ? (
          <Text style={{ color: 'red' }}>{error}</Text>
        ) : (
          <FlatList
            data={checkIns}
            keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<Text>Seçili filtrelere göre check-in kaydı bulunamadı.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#3C3169',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateBtn: {
    backgroundColor: '#ECE6F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  dateBtnText: {
    color: '#3C3169',
    fontWeight: 'bold',
  },
  searchBtn: {
    backgroundColor: '#3C3169',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  item: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemSub: {
    fontSize: 14,
    color: '#555',
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionBtn: {
    marginTop: 10,
    backgroundColor: '#3C3169',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    opacity: 1,
  },
  actionBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 