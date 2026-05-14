// src/screens/client/ApproachEditorScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/api';

export default function ApproachEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { trainingId, exerciseId, approachId, exerciseType } = route.params;

  const isEditing = !!approachId;
  const isWeightReps = exerciseType === 'Вес и повторения';
  const isTimeDist = exerciseType === 'Время и дистанция';

  // Значения полей
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [distance, setDistance] = useState('');
  const [timeSeconds, setTimeSeconds] = useState('');
  const [loading, setLoading] = useState(false);

  // Состояние "изменено ли" для кнопки "Обновить"
  const [isDirty, setIsDirty] = useState(false);

  // Загружаем данные подхода, если редактируем
  useEffect(() => {
    if (isEditing) {
      fetchApproach();
    }
  }, []);

  const fetchApproach = async () => {
    try {
      const res = await fetch(`${API_URL}/workout/approaches/${approachId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const approach = Array.isArray(data) ? data[0] : data;
      if (isWeightReps) {
        setWeight(approach.weigth ? approach.weigth.toString() : '');
        setReps(approach.repetitions ? approach.repetitions.toString() : '');
      } else {
        // Время хранится в секундах, конвертируем в мм:сс или просто секунды
        const seconds = approach.time || 0;
        setTimeSeconds(seconds.toString());
        setDistance(approach.distance ? approach.distance.toString() : '');
      }
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные подхода');
    }
  };

  const handleSave = async () => {
    // Валидация
    if (isWeightReps) {
      if (!weight || !reps) {
        Alert.alert('Ошибка', 'Заполните вес и повторения');
        return;
      }
    } else {
      if (!distance || !timeSeconds) {
        Alert.alert('Ошибка', 'Заполните дистанцию и время');
        return;
      }
    }

    setLoading(true);
    try {
      const body = {};
      if (isWeightReps) {
        body.weigth = parseFloat(weight);
        body.repetitions = parseInt(reps, 10);
        body.distance = null;
        body.time = null;
      } else {
        body.distance = parseFloat(distance);
        body.time = parseInt(timeSeconds, 10);
        body.weigth = null;
        body.repetitions = null;
      }
      body.exercise_id = exerciseId;
      body.training_id = trainingId;

      let url = `${API_URL}/workout/approaches`;
      let method = 'POST';
      if (isEditing) {
        url = `${API_URL}/workout/approaches/${approachId}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error();
      Alert.alert('Успех', isEditing ? 'Подход обновлён' : 'Подход добавлен');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось сохранить подход');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (isWeightReps) {
      setWeight('');
      setReps('');
    } else {
      setDistance('');
      setTimeSeconds('');
    }
    setIsDirty(false);
  };

  // Отслеживание изменений для кнопки "Обновить"
  useEffect(() => {
    if (isEditing) {
      // Простая проверка: если поля изменились с момента загрузки – считаем dirty
      // Можно реализовать точнее, но для простоты пока всегда разрешаем обновление
      setIsDirty(true);
    }
  }, [weight, reps, distance, timeSeconds]);

  // Вспомогательный рендер для времени (можно добавить маску, пока просто секунды)
  const renderTimeInput = () => (
    <View>
      <Text style={styles.label}>Время (секунды)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={timeSeconds}
        onChangeText={setTimeSeconds}
        placeholder="например, 1800"
      />
      <Text style={styles.hint}>* 30 минут = 1800 секунд</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Верхняя панель с заголовком и кнопкой назад */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.title}>{isEditing ? 'Редактировать подход' : 'Новый подход'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Вкладки (TRACK активная, HISTORY/GRAPH пока заглушки) */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={styles.activeTabText}>TRACK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => Alert.alert('История', 'Будет позже')}>
            <Text style={styles.tabText}>HISTORY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => Alert.alert('График', 'Будет позже')}>
            <Text style={styles.tabText}>GRAPH</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          {isWeightReps ? (
            <>
              <Text style={styles.label}>Вес (кг)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
                placeholder="0.0"
              />
              <Text style={styles.label}>Повторения</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={reps}
                onChangeText={setReps}
                placeholder="0"
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Дистанция (м)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={distance}
                onChangeText={setDistance}
                placeholder="0"
              />
              {renderTimeInput()}
            </>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClear}>
              <Text style={styles.clearButtonText}>CLEAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, (!isEditing || isDirty) && styles.saveButtonActive]}
              onPress={handleSave}
              disabled={loading || (isEditing && !isDirty)}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Сохранение...' : isEditing ? 'ОБНОВИТЬ' : 'СОХРАНИТЬ'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Можно также показать список существующих подходов (как на референсе) */}
          {/* Пока оставим пустым, но при желании можно подгрузить подходы этого упражнения */}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: { fontSize: 14, color: '#6B7280' },
  activeTabText: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
  form: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: -12, marginBottom: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 30, alignItems: 'center', marginHorizontal: 6 },
  clearButton: { backgroundColor: '#F3F4F6' },
  clearButtonText: { color: '#4B5563', fontWeight: '600' },
  saveButton: { backgroundColor: '#9CA3AF' },
  saveButtonActive: { backgroundColor: '#4F46E5' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});