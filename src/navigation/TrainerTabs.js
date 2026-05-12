import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import TrainerScheduleScreen from '../screens/trainer/TrainerScheduleScreen';
import TrainersDiaryScreen from '../screens/trainer/TrainersDiaryScreen';

const Tab = createBottomTabNavigator();

export default function TrainerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Расписание') iconName = 'calendar';
          else if (route.name === 'Дневники') iconName = 'book';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Расписание" component={TrainerScheduleScreen} />
      <Tab.Screen name="Дневники" component={TrainersDiaryScreen} options={{ tabBarLabel: 'Дневники тренировок' }} />
    </Tab.Navigator>
  );
}