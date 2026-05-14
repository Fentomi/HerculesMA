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

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [distance, setDistance] = useState('');
  const [timeSeconds, setTimeSeconds] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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
        const seconds = approach.time || 0;
        setTimeSeconds(seconds.toString());
        setDistance(approach.distance ? approach.distance.toString() : '');
      }
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные подхода');
    }
  };

  const handleSave = async () => {
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
      navigation.goBack();
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось сохранить подход');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Удаление подхода',
      'Вы уверены, что хотите удалить этот подход?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${API_URL}/workout/approaches/${approachId}`, {
                method: 'DELETE',
              });
              if (!response.ok) throw new Error();
              navigation.goBack();
            } catch (err) {
              Alert.alert('Ошибка', 'Не удалось удалить подход');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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

  useEffect(() => {
    setIsDirty(true);
  }, [weight, reps, distance, timeSeconds]);

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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.title}>{isEditing ? 'Редактировать подход' : 'Новый подход'}</Text>
          <View style={{ width: 40 }} />
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
            {isEditing ? (
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Удалить</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClear}>
                <Text style={styles.clearButtonText}>Очистить</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                (isEditing ? isDirty : true) && styles.saveButtonActive,
              ]}
              onPress={handleSave}
              disabled={loading || (isEditing && !isDirty)}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Сохранение...' : isEditing ? 'Обновить' : 'Сохранить'}
              </Text>
            </TouchableOpacity>
          </View>
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
  deleteButton: { backgroundColor: '#FEE2E2' },
  deleteButtonText: { color: '#DC2626', fontWeight: '600' },
  saveButton: { backgroundColor: '#9CA3AF' },
  saveButtonActive: { backgroundColor: '#4F46E5' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});