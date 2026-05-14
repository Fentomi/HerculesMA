import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import MainScreen from '../screens/MainScreen';
import TrainingScreen from '../screens/client/TrainingScreen';
import ApproachEditorScreen from '../screens/client/ApproachEditorScreen';
import CategoriesScreen from '../screens/client/CategoriesScreen';
import ExercisesByCategoryScreen from '../screens/client/ExercisesByCategoryScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Training" component={TrainingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ApproachEditor" component={ApproachEditorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Categories" component={CategoriesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ExercisesByCategory" component={ExercisesByCategoryScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}