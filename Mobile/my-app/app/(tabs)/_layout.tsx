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
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarShowLabel: false,
        tabBarIconStyle: {
          width: 32,
          height: 32,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialIcons name="home" size={focused ? 32 : 28} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="customerInfo"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialIcons name="people" size={focused ? 32 : 28} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="checkIn"
        options={{
          title: 'Check-In',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialIcons name="login" size={focused ? 32 : 28} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="checkOut"
        options={{
          title: 'Check-Out',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialIcons name="logout" size={focused ? 32 : 28} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: 'Rooms',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialIcons name="hotel" size={focused ? 32 : 28} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="other"
        options={{
          title: 'Others',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialIcons name="more-horiz" size={focused ? 32 : 28} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
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
  iconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: 45,
  },
  activeIndicator: {
    backgroundColor: '#6B3DC9',
    width: 24,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    position: 'absolute',
    bottom: -12,
  },
});
