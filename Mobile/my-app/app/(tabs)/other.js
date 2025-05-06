import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  StatusBar 
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function OtherScreen() {
  const router = useRouter();
  
  const navigateToSection = (section) => {
    switch(section) {
      case 'Accounting':
        router.push('/accounting');
        break;
      case 'Financial Reports':
        router.push('/financial-reports');
        break;
      case 'Manage Staff':
        router.push('/manage-staff');
        break;
      case 'Manage Rooms':
        router.push('/manage-rooms');
        break;
      default:
        console.log(`Navigation to ${section} not implemented yet`);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Diğer İşlemler</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Yönetim İşlemleri</Text>
        
        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {/* Accounting */}
          <TouchableOpacity 
            style={[styles.menuItem, {backgroundColor: '#8E44AD'}]} 
            onPress={() => navigateToSection('Accounting')}
          >
            <MaterialIcons name="account-balance" size={48} color="white" />
            <Text style={styles.menuItemText}>Muhasebe</Text>
          </TouchableOpacity>
          
          {/* Financial Reports */}
          <TouchableOpacity 
            style={[styles.menuItem, {backgroundColor: '#2E86C1'}]} 
            onPress={() => navigateToSection('Financial Reports')}
          >
            <FontAwesome5 name="chart-line" size={40} color="white" />
            <Text style={styles.menuItemText}>Finansal Raporlar</Text>
          </TouchableOpacity>
          
          {/* Manage Staff */}
          <TouchableOpacity 
            style={[styles.menuItem, {backgroundColor: '#16A085'}]} 
            onPress={() => navigateToSection('Manage Staff')}
          >
            <MaterialIcons name="groups" size={48} color="white" />
            <Text style={styles.menuItemText}>Personel Yönetimi</Text>
          </TouchableOpacity>
          
          {/* Manage Rooms */}
          <TouchableOpacity 
            style={[styles.menuItem, {backgroundColor: '#E67E22'}]} 
            onPress={() => navigateToSection('Manage Rooms')}
          >
            <MaterialIcons name="meeting-room" size={48} color="white" />
            <Text style={styles.menuItemText}>Oda Yönetimi</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.sectionTitle}>Sistem</Text>
        
        {/* System Options */}
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.listItem}>
            <MaterialIcons name="settings" size={24} color="#6B3DC9" />
            <Text style={styles.listItemText}>Ayarlar</Text>
            <MaterialIcons name="chevron-right" size={24} color="#777" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.listItem}>
            <MaterialIcons name="help" size={24} color="#6B3DC9" />
            <Text style={styles.listItemText}>Yardım</Text>
            <MaterialIcons name="chevron-right" size={24} color="#777" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.listItem}>
            <MaterialIcons name="info" size={24} color="#6B3DC9" />
            <Text style={styles.listItemText}>Hakkında</Text>
            <MaterialIcons name="chevron-right" size={24} color="#777" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    backgroundColor: '#6B3DC9',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 15,
    color: '#333',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuItem: {
    width: '48%',
    height: 150,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  menuList: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
}); 