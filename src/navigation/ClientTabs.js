import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import ScheduleScreen from '../screens/client/ScheduleScreen';
import MembershipsScreen from '../screens/client/MembershipsScreen';
import ServicesScreen from '../screens/client/ServicesScreen';
import TrainingDiaryScreen from '../screens/client/TrainingDiaryScreen';

const Tab = createBottomTabNavigator();

export default function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Расписание') iconName = 'calendar';
          else if (route.name === 'Абонементы') iconName = 'card';
          else if (route.name === 'Услуги') iconName = 'list';
          else if (route.name === 'Дневник') iconName = 'book';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Расписание" component={ScheduleScreen} />
      <Tab.Screen name="Абонементы" component={MembershipsScreen} />
      <Tab.Screen name="Услуги" component={ServicesScreen} />
      <Tab.Screen name="Дневник" component={TrainingDiaryScreen} options={{ tabBarLabel: 'Дневник тренировок' }} />
    </Tab.Navigator>
  );
}