import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const username = params.username || "Utku Adanur"; // Default if not provided
  
  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Oturumu kapatmak istediğinize emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        { 
          text: "Çıkış Yap", 
          onPress: () => router.replace('/') 
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Main Page</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.username}>{username}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Greeting */}
        <Text style={styles.greeting}>Hoş Geldiniz, Otel Yönetim Sistemine</Text>
        
        {/* Daily Summary */}
        <Text style={styles.sectionTitle}>Bugünün Özeti</Text>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {/* Rooms Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialIcons name="hotel" size={24} color="#4C3A89" />
              <Text style={styles.statTitle}>Odalar</Text>
            </View>
            <Text style={styles.statValue}>45/120</Text>
            <Text style={styles.statSubtitle}>Müsait oda sayısı</Text>
            <View style={styles.statDetails}>
              <Text style={styles.statDetailText}>45 müsait</Text>
              <Text style={styles.statDetailText}>68 dolu</Text>
              <Text style={styles.statDetailText}>7 bakımda</Text>
            </View>
          </View>
          
          {/* Check In/Out Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialIcons name="swap-horiz" size={24} color="#4CAF50" />
              <Text style={styles.statTitle}>Giriş/Çıkış</Text>
            </View>
            <View style={styles.statDoubleValue}>
              <View style={styles.statDoubleItem}>
                <Text style={styles.statValue}>15</Text>
                <Text style={styles.statSubtitle}>Bugünkü giriş</Text>
              </View>
              <View style={styles.statDoubleItem}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statSubtitle}>Bugünkü çıkış</Text>
              </View>
            </View>
          </View>
          
          {/* Revenue Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <FontAwesome5 name="lira-sign" size={20} color="#2E7D32" />
              <Text style={styles.statTitle}>Gelir</Text>
            </View>
            <Text style={styles.statValue}>24.500 ₺</Text>
            <Text style={styles.statSubtitle}>Bugünkü gelir</Text>
            <Text style={styles.statDetail}>Bu ay: 356.000 ₺</Text>
          </View>
          
          {/* Reservations Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialIcons name="event-available" size={24} color="#1976D2" />
              <Text style={styles.statTitle}>Rezervasyonlar</Text>
            </View>
            <Text style={styles.statValue}>32</Text>
            <Text style={styles.statSubtitle}>Önümüzdeki 7 gün</Text>
          </View>
        </View>
        
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4C3A89' }]}
            onPress={() => router.push('/rooms')}
          >
            <MaterialIcons name="meeting-room" size={24} color="white" />
            <Text style={styles.actionButtonText}>ODA DURUMUNU GÖRÜNTÜLE</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => router.push('/checkIn')}
          >
            <MaterialIcons name="login" size={24} color="white" />
            <Text style={styles.actionButtonText}>YENİ GİRİŞ İŞLEMİ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#3949AB' }]}
            onPress={() => router.push('/checkOut')}
          >
            <MaterialIcons name="logout" size={24} color="white" />
            <Text style={styles.actionButtonText}>YENİ ÇIKIŞ İŞLEMİ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#1976D2' }]}
            onPress={() => router.push('/customerInfo')}
          >
            <MaterialIcons name="people" size={24} color="white" />
            <Text style={styles.actionButtonText}>MÜŞTERİ LİSTESİ</Text>
          </TouchableOpacity>
        </View>
        
        {/* Database Status */}
        <View style={styles.databaseStatus}>
          <Text style={styles.databaseTitle}>Veritabanı Durumu</Text>
          <View style={styles.databaseDetails}>
            <View style={styles.databaseItem}>
              <Text style={styles.databaseLabel}>Toplam Müşteri:</Text>
              <Text style={styles.databaseValue}>250</Text>
            </View>
            
            <View style={styles.databaseItem}>
              <Text style={styles.databaseLabel}>Son Güncelleme:</Text>
              <Text style={styles.databaseValue}>26.03.2025 22:54:30</Text>
            </View>
            
            <View style={styles.databaseItem}>
              <Text style={styles.databaseLabel}>Veritabanı Bağlantısı:</Text>
              <Text style={[styles.databaseValue, styles.activeStatus]}>Aktif</Text>
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2023 Otel Yönetim Sistemi - Tüm Hakları Saklıdır</Text>
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
  header: {
    backgroundColor: '#3C3169',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    marginRight: 10,
  },
  username: {
    color: 'white',
    fontSize: 16,
    marginRight: 10,
  },
  logoutButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#555',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#555',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },
  statDetails: {
    marginTop: 10,
  },
  statDetailText: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  statDoubleValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statDoubleItem: {
    width: '45%',
  },
  statDetail: {
    fontSize: 13,
    color: '#777',
    marginTop: 10,
  },
  quickActions: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4C3A89',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 14,
  },
  databaseStatus: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  databaseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  databaseDetails: {
    marginBottom: 5,
  },
  databaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  databaseLabel: {
    color: '#555',
    fontSize: 14,
  },
  databaseValue: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },
  activeStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    color: '#777',
    fontSize: 12,
  },
});
