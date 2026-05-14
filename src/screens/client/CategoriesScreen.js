// src/screens/client/CategoriesScreen.js
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
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/api';
import ColorPicker from 'react-native-wheel-color-picker';

export default function CategoriesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { trainingId } = route.params; // получаем trainingId из параметров

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#4F46E5');
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/workout/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryColor('#4F46E5');
    setModalVisible(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.rgb_color);
    setModalVisible(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Ошибка', 'Введите название категории');
      return;
    }
    setSaving(true);
    try {
      const url = editingCategory
        ? `${API_URL}/workout/categories/${editingCategory.category_id}`
        : `${API_URL}/workout/categories`;
      const method = editingCategory ? 'PUT' : 'POST';
      const body = JSON.stringify({ name: categoryName, rgb_color: categoryColor });
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
      if (!res.ok) throw new Error();
      Alert.alert('Успех', editingCategory ? 'Категория обновлена' : 'Категория создана');
      setModalVisible(false);
      loadCategories();
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось сохранить категорию');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = (categoryId) => {
    Alert.alert('Удаление', 'Удалить категорию и все упражнения в ней?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/workout/categories/${categoryId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            loadCategories();
          } catch (err) {
            Alert.alert('Ошибка', 'Не удалось удалить категорию');
          }
        },
      },
    ]);
  };

  const renderCategoryItem = ({ item }) => (
    <View style={styles.categoryItem}>
      <TouchableOpacity
        style={styles.categoryContent}
        onPress={() => {
          navigation.navigate('ExercisesByCategory', {
            categoryId: item.category_id,
            categoryName: item.name,
            trainingId: trainingId, // передаём trainingId дальше
          });
        }}
      >
        <View style={[styles.colorBadge, { backgroundColor: item.rgb_color }]} />
        <Text style={styles.categoryName}>{item.name}</Text>
      </TouchableOpacity>
      <View style={styles.menuContainer}>
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          style={styles.menuButton}
        >
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
        <Text style={styles.title}>Категории упражнений</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.category_id.toString()}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.list}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCategory ? 'Редактировать категорию' : 'Новая категория'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Название"
              value={categoryName}
              onChangeText={setCategoryName}
            />
            <Text style={styles.label}>Цвет категории</Text>
            <ColorPicker
              color={categoryColor}
              onColorChange={setCategoryColor}
              thumbSize={30}
              sliderSize={20}
              noSnap={true}
              row={false}
              style={styles.colorPicker}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveCategory} disabled={saving}>
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
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  colorBadge: { width: 24, height: 24, borderRadius: 12, marginRight: 12 },
  categoryName: { fontSize: 16, color: '#1A1A1A' },
  menuContainer: { width: 40, alignItems: 'flex-end' },
  menuButton: { padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' },
  colorPicker: { height: 200, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 6 },
  cancelButton: { backgroundColor: '#F3F4F6' },
  saveButton: { backgroundColor: '#4F46E5' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});