import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Dimensions, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalFriendRequests } from '../../context/globalFriendRequests';
import { useGlobalNotifications } from '../../context/globalNotifications';
import { NotificationsProvider } from '../../context/notifications';
import { useAuth } from '../context/auth';

// const ACTIVE_TAB_COLOR = '#D4FC79'; // Electric Volt
const ACTIVE_TAB_COLOR = '#D4FC79'; // Electric Volt
const INACTIVE_TAB_COLOR = '#000000ff';

const BOTTOM_MARGIN = 20;
const SIDE_MARGIN = 30;

// Composant pour l'icône de l'onglet avec un fond actif
const TabIcon = ({
  focused,
  color,
  iconName,
  focusedIconName
}: {
  focused: boolean;
  color: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  focusedIconName: React.ComponentProps<typeof Ionicons>['name'];
}) => {
  if (focused) {
    return (
      <View style={{
        backgroundColor: ACTIVE_TAB_COLOR,
        width: 35,
        height: 35,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4, // Légère correction d'alignement visuel
      }}>
        <Ionicons name={focusedIconName} size={22} color="#000" />
      </View>
    );
  }
  return <Ionicons name={iconName} size={24} color={color} />;
};

function TabLayoutContent() {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const tabBarWidth = Platform.OS === 'ios' ? screenWidth - (SIDE_MARGIN * 2) : undefined;
  const { unreadCount } = useGlobalNotifications();
  const { friendRequestsCount } = useGlobalFriendRequests();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Protection d'authentification : rediriger si pas d'utilisateur connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, router]);

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Ne pas rendre les tabs si pas d'utilisateur connecté
  if (!user) {
    return <View style={{ flex: 1, backgroundColor: '#FFF' }} />;
  }

  // Calculer les badges
  const notificationsBadge = unreadCount > 0 ? unreadCount : undefined;
  const friendsBadge = friendRequestsCount > 0 ? friendRequestsCount : undefined;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: INACTIVE_TAB_COLOR,
        tabBarInactiveTintColor: INACTIVE_TAB_COLOR, // Improved visibility
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <View style={{ flex: 1, borderRadius: 35, overflow: 'hidden' }}>
              <BlurView
                tint="systemMaterialDark"
                intensity={10}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ) : undefined
        ),
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#000',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingTop: Platform.OS === 'ios' ? 0 : 10,
          paddingBottom: Platform.OS === 'ios' ? 0 : 10,
          position: Platform.OS === 'ios' ? 'absolute' : 'relative',
          bottom: Platform.OS === 'ios' ? (insets.bottom > 0 ? insets.bottom : BOTTOM_MARGIN) : 0,
          ...(Platform.OS === 'ios' && tabBarWidth ? {
            width: tabBarWidth,
            marginLeft: SIDE_MARGIN,
          } : {}),
          borderRadius: Platform.OS === 'ios' ? 35 : 0,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarItemStyle: {
          // Ensure items are centered
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: Platform.OS === 'ios' ? 10 : 0,
        },
        tabBarLabelStyle: {
          fontSize: 9, // Reduced font size
          fontWeight: '900',
          fontStyle: 'italic',
          marginTop: 4,
          letterSpacing: 0, // Removed letter spacing to save space
        },
        tabBarBadgeStyle: {
          backgroundColor: ACTIVE_TAB_COLOR,
          color: '#000',
          fontSize: 10,
          fontWeight: '900',
          height: 18,
          minWidth: 18,
          borderRadius: 9,
        },
        headerShown: false,
        animation: 'fade',
        lazy: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'MATCHS', // Shortened from SESSIONS
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} iconName="calendar-outline" focusedIconName="calendar" />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'SQUAD',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} iconName="people-outline" focusedIconName="people" />
          ),
          tabBarBadge: friendsBadge,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'ALERTS',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} iconName="notifications-outline" focusedIconName="notifications" />
          ),
          tabBarBadge: notificationsBadge,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'HISTO', // Shortened from HISTORIQUE
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} iconName="time-outline" focusedIconName="time" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFIL',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} iconName="person-outline" focusedIconName="person" />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <NotificationsProvider>
      <TabLayoutContent />
    </NotificationsProvider>
  );
}
