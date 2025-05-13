import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';

export default function AccessDeniedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get return path and page name from params
  const returnPath = params.returnPath || '/(tabs)/other';
  const pageName = params.page || 'this page';
  
  const handleGoBack = () => {
    router.replace(returnPath);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar backgroundColor="#e74c3c" barStyle="light-content" />
      
      <View style={styles.content}>
        <MaterialIcons name="lock" size={120} color="#e74c3c" style={styles.icon} />
        
        <Text style={styles.title}>Access Denied</Text>
        
        <Text style={styles.message}>
          You do not have permission to access {pageName}.
        </Text>
        
        <Text style={styles.subText}>
          Please contact your administrator if you believe you should have access to this area.
        </Text>
        
        <TouchableOpacity style={styles.button} onPress={handleGoBack}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    maxWidth: 300,
  },
  subText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#3C3169',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 