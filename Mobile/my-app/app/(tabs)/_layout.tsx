import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="customerInfo"
        options={{
          title: 'Müşteriler',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="checkIn"
        options={{
          title: 'Giriş',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="login" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="checkOut"
        options={{
          title: 'Çıkış',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="logout" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: 'Odalar',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="hotel" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="other"
        options={{
          title: 'Diğer',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="more-horiz" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
