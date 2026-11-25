import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/main/HomeScreen';
import FavoritesScreen from '../screens/main/FavoritesScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import MoreScreen from '../screens/main/MoreScreen';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { isMale } = useAuth();
  const insets = useSafeAreaInsets();

  // On Android with 3-button system bar, insets.bottom is ~48dp.
  // With gesture bar, it's ~24dp.
  // We add sufficient bottom padding so the tabs sit completely ABOVE the Android buttons.
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 24 : 14);
  const tabHeight = 60 + bottomInset;

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#E91E63',
        tabBarInactiveTintColor: '#8B94B7',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1.5,
          borderTopColor: '#F1F4F9',
          height: tabHeight,
          paddingBottom: bottomInset + 4,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#2D1B4D',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = 'home';
          } else if (route.name === 'FavoritesTab') {
            iconName = 'heart';
          } else if (route.name === 'EditProfileTab') {
            iconName = 'document-text';
          } else if (route.name === 'SubscriptionsTab') {
            iconName = 'card';
          } else if (route.name === 'ProfileTab') {
            iconName = 'person';
          } else if (route.name === 'MoreTab') {
            iconName = 'ellipsis-horizontal';
          }

          return <Ionicons name={iconName} size={23} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'الرئيسية' }}
      />

      {isMale && (
        <Tab.Screen
          name="FavoritesTab"
          component={FavoritesScreen}
          options={{ tabBarLabel: 'المفضلات' }}
        />
      )}

      <Tab.Screen
        name="EditProfileTab"
        component={EditProfileScreen}
        options={{ tabBarLabel: 'استمارتي' }}
      />

      {isMale ? (
        <Tab.Screen
          name="SubscriptionsTab"
          component={SubscriptionScreen}
          options={{ tabBarLabel: 'الاشتراكات' }}
        />
      ) : (
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{ tabBarLabel: 'حسابي' }}
        />
      )}

      <Tab.Screen
        name="MoreTab"
        component={MoreScreen}
        options={{ tabBarLabel: 'المزيد' }}
      />
    </Tab.Navigator>
  );
}
