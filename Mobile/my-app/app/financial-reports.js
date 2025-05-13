import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { hasPageAccess } from '../services/roleService';
import AccessDenied from '../components/AccessDenied';

export default function FinancialReportsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(true);
  
  // Check if user has permission to access this page
  useEffect(() => {
    // Don't check access until user is loaded
    if (!user) return;
    
    console.log('Checking financial-reports access for:', user);
    
    // Debug the roles array
    if (user.roles) {
      if (Array.isArray(user.roles)) {
        console.log('User roles (array):', user.roles);
      } else if (typeof user.roles === 'string') {
        // Handle case where roles might be stored as a string
        console.log('User roles (string):', user.roles);
        // If roles are stored as a comma-separated string
        const rolesArray = user.roles.split(',').map(r => r.trim());
        console.log('Converting to array:', rolesArray);
        // Overwrite user for permission check
        user.roles = rolesArray;
      } else {
        console.log('Unexpected roles format:', typeof user.roles);
      }
    } else {
      console.log('No roles found for user');
    }
    
    try {
      // Check for admin/administrator directly
      if (user.roles && Array.isArray(user.roles)) {
        const hasAdminRole = user.roles.some(role => 
          typeof role === 'string' && 
          (role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator')
        );
        
        if (hasAdminRole) {
          console.log('User has admin role, granting access');
          setHasAccess(true);
          return;
        }
      }
      
      // Fallback to standard permission check
      const canAccess = hasPageAccess(user, 'financial-reports');
      console.log('Access result from permission check:', canAccess);
      setHasAccess(canAccess);
    } catch (error) {
      console.error('Error in access check:', error);
      // On error, default to grant access to avoid lockouts
      setHasAccess(true);
    }
  }, [user]);
  
  // If user doesn't have access, show access denied screen
  if (!hasAccess) {
    return <AccessDenied />;
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finansal Raporlar</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.content}>
        <FontAwesome5 name="chart-line" size={80} color="#2E86C1" />
        <Text style={styles.title}>Finansal Raporlar</Text>
        <Text style={styles.subtitle}>Bu özellik yakında eklenecektir</Text>
      </View>
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
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 