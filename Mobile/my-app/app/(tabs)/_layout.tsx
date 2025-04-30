import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    // Show confirmation dialog
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: async () => {
            console.log('Logging out...');
            await logout();
            console.log('Logged out, redirecting to login screen...');
            router.replace('/');
          }
        }
      ]
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6B3DC9',
        tabBarInactiveTintColor: '#888',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#f8f8f8',
          borderTopColor: '#ddd',
          height: 60,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="customerInfo"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="checkIn"
        options={{
          title: 'Check-In',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="login" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="checkOut"
        options={{
          title: 'Check-Out',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="logout" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: 'Rooms',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="hotel" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="other"
        options={{
          title: 'Others',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="more-horiz" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  logoutText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
});
