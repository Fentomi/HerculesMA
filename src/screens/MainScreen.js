import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ClientTabs from '../navigation/ClientTabs';
import TrainerTabs from '../navigation/TrainerTabs';

export default function MainScreen() {
  const { user } = useAuth();

  if (!user) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (user.role_id === 3) {
    return <TrainerTabs />;
  } else if (user.role_id === 5) {
    return <ClientTabs />;
  }

  // На случай другой роли
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});