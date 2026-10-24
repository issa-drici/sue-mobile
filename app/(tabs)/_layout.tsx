import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Dimensions, Image, ImageSourcePropType, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalFriendRequests } from '../../context/globalFriendRequests';
import { useGlobalNotifications } from '../../context/globalNotifications';
import { NotificationsProvider } from '../../context/notifications';
import { useAuth } from '../context/auth';

const ACTIVE_TAB_COLOR = '#D4FC79'; // Volt Électrique (unifié)
const INACTIVE_TAB_COLOR = '#000000ff'; // Noir d'origine

const BOTTOM_MARGIN = 20;

// Icônes 2,5D du kit Sue. L'onglet actif garde son fond volt ("Liquid Bar"), l'inactif est atténué.
const TAB_ICONS = {
  sessions: require('../../assets/images/brand/tab-sessions.webp'),
  profile: require('../../assets/images/brand/tab-profile.webp'),
};

const TabIcon = ({ focused, source }: { focused: boolean; source: ImageSourcePropType }) => {
  return (
    <View style={{
      backgroundColor: focused ? ACTIVE_TAB_COLOR : 'transparent',
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Image source={source} style={{ width: 32, height: 32, opacity: focused ? 1 : 0.6 }} resizeMode="contain" />
    </View>
  );
};

function TabLayoutContent() {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const tabBarWidth = Math.min(160, screenWidth * 0.45); // Un peu plus large pour éviter les coupures de texte
  const leftMargin = (screenWidth - tabBarWidth) / 2; // Centrage
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
  const friendsBadge = friendRequestsCount > 0 ? friendRequestsCount : undefined;

  return (
    <Tabs
      screenOptions={{
        safeAreaInsets: { bottom: 0, top: 0, left: 0, right: 0 },
        tabBarActiveTintColor: INACTIVE_TAB_COLOR,
        tabBarInactiveTintColor: INACTIVE_TAB_COLOR,
        tabBarLabelPosition: 'below-icon', // Forcer le label en dessous
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <View style={{ flex: 1, borderRadius: 34, overflow: 'hidden' }}>
              <BlurView
                tint="systemMaterialDark"
                intensity={10}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ) : undefined
        ),
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#FFF',
          borderTopWidth: 0,
          height: 68,
          position: 'absolute',
          bottom: insets.bottom > 0 ? insets.bottom : BOTTOM_MARGIN,
          width: tabBarWidth,
          marginLeft: leftMargin,
          borderRadius: 34,
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
          justifyContent: 'flex-start',
          alignItems: 'center',
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '900',
          fontStyle: 'italic',
          marginTop: 4,
          letterSpacing: 0,
          height: 12,
          lineHeight: 12,
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
          title: 'Sessions',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} source={TAB_ICONS.sessions} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          href: null, // Masqué
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Masqué
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null, // Masqué
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} source={TAB_ICONS.profile} />
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
