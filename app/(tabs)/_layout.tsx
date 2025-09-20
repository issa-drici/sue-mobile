import { BrandColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useGlobalFriendRequests } from '../../context/globalFriendRequests';
import { useGlobalNotifications } from '../../context/globalNotifications';
import { NotificationsProvider } from '../../context/notifications';

function TabLayoutContent() {
  const { unreadCount } = useGlobalNotifications();
  const { friendRequestsCount } = useGlobalFriendRequests();

  // Calculer les badges
  const notificationsBadge = unreadCount > 0 ? unreadCount : undefined;
  const friendsBadge = friendRequestsCount > 0 ? friendRequestsCount : undefined;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BrandColors.primary,
        // tabBarInactiveTintColor: '#666',
        // tabBarStyle: {
        //   backgroundColor: '#fff',
        //   borderTopWidth: 1,
        //   borderTopColor: '#e0e0e0',
        // },

        // headerShown: false,
        // tabBarStyle: {
        //   padding: 10,
        //   display: 'flex',
        //   flexDirection: 'row',
        //   justifyContent: 'space-between',
        //   alignItems: 'center',

        //   borderRadius: 12,
        //   paddingHorizontal: 14,
        //   gap: 100,
        // },
        // tabBarStyle: {
        //   paddingVertical: 10,
        //   display: 'flex',
        //   flexDirection: 'row',
        //   justifyContent: 'space-around',
        //   alignItems: 'center',
        //   gap: 100,
        // },

        tabBarBadgeStyle: {
          // backgroundColor: '#FF6600',
          color: '#fff',
          fontSize: 10.5,
          fontWeight: 'bold',
          height: 17.5,
        },

        // tabBarButton: (props) => {
        //   const isSelected = props.accessibilityState?.selected;
        //   return (
        //     <Pressable {...props} style={{
        //       display: 'flex',
        //       flexDirection: 'column',
        //       justifyContent: 'center',
        //       alignItems: 'center',
        //       // flex: 1,
        //       backgroundColor: isSelected ? '#FFF4F2' : undefined,
        //       borderRadius: 12,
        //       paddingHorizontal: 14,
        //       paddingVertical: 7,
        //     }}>
        //       {props.children}
        //     </Pressable>
        //   )
        // },
        // tabBarActiveTintColor: '#FF6600',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications-outline" size={21} color={color} />
          ),
          tabBarBadge: notificationsBadge,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Amis',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={21} color={color} />
          ),
          tabBarBadge: friendsBadge,

        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color }) => (
            <Ionicons name="time-outline" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={21} color={color} />
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




// import { Ionicons } from '@expo/vector-icons';
// import { Tabs } from 'expo-router';
// import React from 'react';
// import { Pressable } from 'react-native';
// import { useGlobalFriendRequests } from '../../context/globalFriendRequests';
// import { useGlobalNotifications } from '../../context/globalNotifications';
// import { NotificationsProvider } from '../../context/notifications';

// function TabLayoutContent() {
//   const { unreadCount } = useGlobalNotifications();
//   const { friendRequestsCount } = useGlobalFriendRequests();

//   // Calculer les badges
//   const notificationsBadge = unreadCount > 0 ? unreadCount : undefined;
//   const friendsBadge = friendRequestsCount > 0 ? friendRequestsCount : undefined;

//   return (
//     <Tabs
//       screenOptions={{
//         // tabBarActiveTintColor: '#007AFF',
//         // tabBarInactiveTintColor: '#666',
//         // tabBarStyle: {
//         //   backgroundColor: '#fff',
//         //   borderTopWidth: 1,
//         //   borderTopColor: '#e0e0e0',
//         // },

//         // headerShown: false,
//         // tabBarStyle: {
//         //   padding: 10,
//         //   display: 'flex',
//         //   flexDirection: 'row',
//         //   justifyContent: 'space-between',
//         //   alignItems: 'center',

//         //   borderRadius: 12,
//         //   paddingHorizontal: 14,
//         //   gap: 100,
//         // },
//         // tabBarStyle: {
//         //   paddingVertical: 10,
//         //   display: 'flex',
//         //   flexDirection: 'row',
//         //   justifyContent: 'space-around',
//         //   alignItems: 'center',
//         //   gap: 100,
//         // },

//         tabBarBadgeStyle: {
//           backgroundColor: '#FF6600',
//           color: '#fff',
//           fontSize: 10.5,
//           fontWeight: 'bold',
//           height: 17.5,
//         },

//         tabBarButton: (props) => {
//           const isSelected = props.accessibilityState?.selected;
//           return (
//             <Pressable {...props} style={{
//               display: 'flex',
//               flexDirection: 'column',
//               justifyContent: 'center',
//               alignItems: 'center',
//               // flex: 1,
//               backgroundColor: isSelected ? '#FFF4F2' : undefined,
//               borderRadius: 12,
//               paddingHorizontal: 14,
//               paddingVertical: 7,
//             }}>
//               {props.children}
//             </Pressable>
//           )
//         },
//         tabBarActiveTintColor: '#FF6600',
//         tabBarInactiveTintColor: 'gray',
//         tabBarLabelStyle: {
//           fontSize: 10.5,
//           fontWeight: '600',
//         },
//         headerShown: false,
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: 'Sessions',
//           tabBarIcon: ({ color }) => (
//             <Ionicons name="calendar-outline" size={21} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="notifications"
//         options={{
//           title: 'Notifications',
//           tabBarIcon: ({ color }) => (
//             <Ionicons name="notifications-outline" size={21} color={color} />
//           ),
//           tabBarBadge: notificationsBadge,
//         }}
//       />
//       <Tabs.Screen
//         name="friends"
//         options={{
//           title: 'Amis',
//           tabBarIcon: ({ color }) => (
//             <Ionicons name="people-outline" size={21} color={color} />
//           ),
//           tabBarBadge: friendsBadge,

//         }}
//       />
//       <Tabs.Screen
//         name="history"
//         options={{
//           title: 'Historique',
//           tabBarIcon: ({ color }) => (
//             <Ionicons name="time-outline" size={21} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: 'Profil',
//           tabBarIcon: ({ color }) => (
//             <Ionicons name="person-outline" size={21} color={color} />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }

// export default function TabLayout() {
//   return (
//     <NotificationsProvider>
//       <TabLayoutContent />
//     </NotificationsProvider>
//   );
// }
