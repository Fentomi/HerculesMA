// src/screens/client/ExercisesByCategoryScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/api';

export default function ExercisesByCategoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryId, categoryName, trainingId } = route.params; // получаем trainingId

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseDesc, setExerciseDesc] = useState('');
  const [exerciseTypeId, setExerciseTypeId] = useState('1');
  const [saving, setSaving] = useState(false);
  const [exerciseTypes, setExerciseTypes] = useState([]);

  const loadExercises = async () => {
    try {
      const res = await fetch(`${API_URL}/workout/exercises`);
      const data = await res.json();
      const filtered = data.filter(ex => ex.category_id === categoryId);
      setExercises(filtered);
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось загрузить упражнения');
    } finally {
      setLoading(false);
    }
  };

  const loadExerciseTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/workout/types`);
      const data = await res.json();
      setExerciseTypes(data);
    } catch (err) {
      console.error(err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExercises();
      loadExerciseTypes();
    }, [categoryId])
  );

  const openCreateModal = () => {
    setEditingExercise(null);
    setExerciseName('');
    setExerciseDesc('');
    setExerciseTypeId('1');
    setModalVisible(true);
  };

  const openEditModal = (exercise) => {
    setEditingExercise(exercise);
    setExerciseName(exercise.name);
    setExerciseDesc(exercise.description || '');
    setExerciseTypeId(exercise.type_id ? exercise.type_id.toString() : '1');
    setModalVisible(true);
  };

  const handleSaveExercise = async () => {
    if (!exerciseName.trim()) {
      Alert.alert('Ошибка', 'Введите название упражнения');
      return;
    }
    setSaving(true);
    try {
      const url = editingExercise
        ? `${API_URL}/workout/exercises/${editingExercise.exercise_id}`
        : `${API_URL}/workout/exercises`;
      const method = editingExercise ? 'PUT' : 'POST';
      const body = JSON.stringify({
        name: exerciseName,
        description: exerciseDesc,
        category_id: categoryId,
        type_id: parseInt(exerciseTypeId, 10),
      });
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
      if (!res.ok) throw new Error();
      Alert.alert('Успех', editingExercise ? 'Упражнение обновлено' : 'Упражнение создано');
      setModalVisible(false);
      loadExercises();
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось сохранить упражнение');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExercise = (exerciseId) => {
    Alert.alert('Удаление', 'Удалить упражнение? Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/workout/exercises/${exerciseId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            loadExercises();
          } catch (err) {
            Alert.alert('Ошибка', 'Не удалось удалить упражнение');
          }
        },
      },
    ]);
  };

  const handleAddToTraining = async (exerciseId) => {
    if (!trainingId) {
      Alert.alert('Ошибка', 'Тренировка не определена');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/workout/trainings/${trainingId}/exercises/${exerciseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка добавления');
      }
      Alert.alert('Успех', 'Упражнение добавлено в тренировку');
      navigation.goBack(); // возврат на экран тренировки
    } catch (err) {
      Alert.alert('Ошибка', err.message);
    }
  };

  const renderExerciseItem = ({ item }) => (
    <View style={styles.exerciseItem}>
      <TouchableOpacity style={styles.exerciseContent} onPress={() => handleAddToTraining(item.exercise_id)}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        {item.description ? <Text style={styles.exerciseDesc}>{item.description}</Text> : null}
      </TouchableOpacity>
      <View style={styles.menuContainer}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>{categoryName}</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.exercise_id.toString()}
        renderItem={renderExerciseItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Нет упражнений в этой категории</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingExercise ? 'Редактировать упражнение' : 'Новое упражнение'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Название"
              value={exerciseName}
              onChangeText={setExerciseName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Описание (необязательно)"
              value={exerciseDesc}
              onChangeText={setExerciseDesc}
              multiline
            />
            <Text style={styles.label}>Тип упражнения</Text>
            <View style={styles.typeSelector}>
              {exerciseTypes.map(type => (
                <TouchableOpacity
                  key={type.type_id}
                  style={[styles.typeButton, exerciseTypeId === type.type_id.toString() && styles.typeButtonActive]}
                  onPress={() => setExerciseTypeId(type.type_id.toString())}
                >
                  <Text style={exerciseTypeId === type.type_id.toString() ? styles.typeTextActive : styles.typeText}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveExercise} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Сохранить</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  addButton: { padding: 8 },
  list: { padding: 16 },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exerciseContent: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  exerciseDesc: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  menuContainer: { width: 40, alignItems: 'flex-end' },
  menuButton: { padding: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' },
  typeSelector: { flexDirection: 'row', marginBottom: 16 },
  typeButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#F3F4F6', marginHorizontal: 4 },
  typeButtonActive: { backgroundColor: '#4F46E5' },
  typeText: { color: '#6B7280' },
  typeTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 6 },
  cancelButton: { backgroundColor: '#F3F4F6' },
  saveButton: { backgroundColor: '#4F46E5' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});