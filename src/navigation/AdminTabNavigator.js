import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminFormsScreen from '../screens/admin/AdminFormsScreen';
import AdminPaymentsScreen from '../screens/admin/AdminPaymentsScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  const { isSuperAdmin } = useAuth();
  const insets = useSafeAreaInsets();

  // On Android with 3-button system bar, insets.bottom is ~48dp.
  // We add sufficient bottom padding so the tabs sit completely ABOVE the Android buttons.
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 24 : 14);
  const tabHeight = 60 + bottomInset;

  return (
    <Tab.Navigator
      initialRouteName="AdminDashboardTab"
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
          fontSize: 10.5,
          fontWeight: '800',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AdminDashboardTab') {
            iconName = 'stats-chart-outline';
          } else if (route.name === 'AdminUsersTab') {
            iconName = 'people-outline';
          } else if (route.name === 'AdminFormsTab') {
            iconName = 'document-text-outline';
          } else if (route.name === 'AdminPaymentsTab') {
            iconName = 'receipt-outline';
          } else if (route.name === 'AdminReportsTab') {
            iconName = 'shield-alert-outline';
          } else if (route.name === 'AdminSettingsTab') {
            iconName = 'settings-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="AdminDashboardTab"
        component={AdminDashboardScreen}
        options={{ tabBarLabel: 'الإحصائيات' }}
      />
      <Tab.Screen
        name="AdminUsersTab"
        component={AdminUsersScreen}
        options={{ tabBarLabel: 'الأعضاء' }}
      />
      <Tab.Screen
        name="AdminFormsTab"
        component={AdminFormsScreen}
        options={{ tabBarLabel: 'الاستمارات' }}
      />
      {isSuperAdmin && (
        <Tab.Screen
          name="AdminPaymentsTab"
          component={AdminPaymentsScreen}
          options={{ tabBarLabel: 'المدفوعات' }}
        />
      )}
      <Tab.Screen
        name="AdminReportsTab"
        component={AdminReportsScreen}
        options={{ tabBarLabel: 'البلاغات' }}
      />
      <Tab.Screen
        name="AdminSettingsTab"
        component={AdminSettingsScreen}
        options={{ tabBarLabel: 'الإعدادات' }}
      />
    </Tab.Navigator>
  );
}
