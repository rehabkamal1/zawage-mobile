import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import TabNavigator from './TabNavigator';
import AdminTabNavigator from './AdminTabNavigator';
import OnboardingScreen, { ONBOARDING_KEY } from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import MatchDetailScreen from '../screens/main/MatchDetailScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import TermsScreen from '../screens/static/TermsScreen';
import PrivacyScreen from '../screens/static/PrivacyScreen';
import AboutScreen from '../screens/static/AboutScreen';
import ContactScreen from '../screens/static/ContactScreen';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasSeenOnboarding(seen === 'true');
      } catch (e) {
        setHasSeenOnboarding(true);
      }
    }
    checkOnboardingStatus();
  }, []);

  if (loading || hasSeenOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // 1. Unauthenticated Users -> Auth Flow (First time shows Onboarding, then Login)
  if (!isAuthenticated) {
    return (
      <Stack.Navigator
        initialRouteName={hasSeenOnboarding ? 'Login' : 'Onboarding'}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="Onboarding">
          {(props) => (
            <OnboardingScreen
              {...props}
              onFinish={() => {
                setHasSeenOnboarding(true);
                props.navigation.replace('Login');
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Contact" component={ContactScreen} />
      </Stack.Navigator>
    );
  }

  // 2. Administrators & Super Admins -> Admin Stack with AdminTabs as primary root
  if (isAdmin) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Contact" component={ContactScreen} />
      </Stack.Navigator>
    );
  }

  // 3. Regular Members (Grooms & Brides) -> Member Stack with MainTabs as primary root
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
