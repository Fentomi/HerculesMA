// src/screens/client/TrainingScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DragList from 'react-native-draglist';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../constants/api';
import { ExerciseCard } from './components/ExerciseCard';
import { trainingStyles as styles } from './styles/trainingStyles';

const toYMD = (date) => date.toISOString().split('T')[0];

export default function TrainingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { clientId } = useAuth();
  const { date, trainingId: initialTrainingId } = route.params;
  
  const [currentDate, setCurrentDate] = useState(date);
  const [trainingId, setTrainingId] = useState(initialTrainingId);
  const [exercises, setExercises] = useState([]);
  const [allTrainings, setAllTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAllTrainings = useCallback(async () => {
    if (!clientId) return [];
    try {
      const res = await fetch(`${API_URL}/workout/trainings`);
      if (!res.ok) throw new Error();
      const all = await res.json();
      const numericClientId = Number(clientId);
      const clientTrainings = all.filter(t => Number(t.client_id) === numericClientId);
      setAllTrainings(clientTrainings);
      return clientTrainings;
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [clientId]);

  const loadTraining = useCallback(async (tid) => {
    if (!tid) {
      setExercises([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/workout/trainings/${tid}/exercises`);
      if (!res.ok) throw new Error('Ошибка загрузки тренировки');
      const data = await res.json();
      const sorted = data.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      setExercises(sorted);
    } catch (err) {
      Alert.alert('Ошибка', err.message);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleApproach = async (approachId, currentIsDone) => {
    const newIsDone = !currentIsDone;
    try {
      const response = await fetch(`${API_URL}/workout/approaches/${approachId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_done: newIsDone }),
      });
      if (!response.ok) throw new Error('Ошибка обновления');
      setExercises(prevExercises =>
        prevExercises.map(ex => ({
          ...ex,
          approaches: ex.approaches.map(ap =>
            ap.approache_id === approachId ? { ...ap, is_done: newIsDone } : ap
          ),
        }))
      );
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось обновить статус подхода');
    }
  };

  const openEditApproach = (approachWithExerciseId) => {
    const exerciseId = approachWithExerciseId.exercise_id;
    const exercise = exercises.find(ex => ex.exercise_id === exerciseId);
    if (!exercise) {
      Alert.alert('Ошибка', 'Упражнение не найдено');
      return;
    }
    const exerciseType = exercise.type_name || (exercise.type_id === 1 ? 'Вес и повторения' : 'Время и дистанция');
    navigation.navigate('ApproachEditor', {
      trainingId: trainingId,
      exerciseId: exerciseId,
      approachId: approachWithExerciseId.approache_id,
      exerciseType: exerciseType,
    });
  };

  const openAddApproach = (exercise) => {
    const exerciseType = exercise.type_name || (exercise.type_id === 1 ? 'Вес и повторения' : 'Время и дистанция');
    navigation.navigate('ApproachEditor', {
      trainingId: trainingId,
      exerciseId: exercise.exercise_id,
      approachId: null,
      exerciseType: exerciseType,
    });
  };

  const removeExerciseFromTraining = async (exerciseId) => {
    try {
      const response = await fetch(`${API_URL}/workout/trainings/${trainingId}/exercises/${exerciseId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Ошибка удаления');
      // Удаляем упражнение из локального состояния
      setExercises(prev => prev.filter(ex => ex.exercise_id !== exerciseId));
      Alert.alert('Успех', 'Упражнение удалено из тренировки');
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось удалить упражнение');
    }
  };

  const onReordered = async (fromIndex, toIndex) => {
    const newData = [...exercises];
    const [movedItem] = newData.splice(fromIndex, 1);
    newData.splice(toIndex, 0, movedItem);
    setExercises(newData);
    const orderIds = newData.map(ex => ex.exercise_id);
    try {
      const response = await fetch(`${API_URL}/workout/trainings/${trainingId}/exercises/order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise_order: orderIds }),
      });
      if (!response.ok) throw new Error();
      console.log('Order saved successfully');
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось сохранить порядок упражнений');
      loadTraining(trainingId);
    }
  };

  const renderItem = ({ item, onDragStart, onDragEnd, isActive }) => (
    <ExerciseCard
      exercise={item}
      onToggleApproach={toggleApproach}
      onAddApproach={openAddApproach}
      onEditApproach={openEditApproach}
      onDeleteExercise={removeExerciseFromTraining} 
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      isActive={isActive}
    />
  );

  useEffect(() => {
    const init = async () => {
      const trainings = await loadAllTrainings();
      const existing = trainings.find(t => toYMD(new Date(t.start_datetime)) === currentDate);
      if (existing && !trainingId) {
        setTrainingId(existing.training_id);
        await loadTraining(existing.training_id);
      } else if (trainingId) {
        await loadTraining(trainingId);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (trainingId) {
        loadTraining(trainingId);
      }
    }, [trainingId, loadTraining])
  );

  const changeDate = async (daysOffset) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + daysOffset);
    const newYMD = toYMD(newDate);
    setCurrentDate(newYMD);
    let trainings = allTrainings;
    if (trainings.length === 0) {
      trainings = await loadAllTrainings();
    }
    const existing = trainings.find(t => toYMD(new Date(t.start_datetime)) === newYMD);
    if (existing) {
      setTrainingId(existing.training_id);
      loadTraining(existing.training_id);
    } else {
      setTrainingId(null);
      setExercises([]);
      setLoading(false);
    }
  };

  const handleStartTraining = () => {
    Alert.alert('Создание тренировки', 'Функция будет добавлена позже');
  };

  const handleAdd = () => {
    if (!trainingId) {
      Alert.alert('Ошибка', 'Сначала создайте тренировку');
      return;
    }
    navigation.navigate('Categories', { trainingId });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>Геркулес</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="calendar-outline" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAdd} style={styles.iconButton}>
            <Ionicons name="add-outline" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navArrow}>
          <Ionicons name="chevron-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.dateText}>
          {new Date(currentDate).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.navArrow}>
          <Ionicons name="chevron-forward" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      ) : trainingId ? (
        <View style={{ flex: 1 }}>
          <DragList
            data={exercises}
            keyExtractor={(item) => item.exercise_id.toString()}
            onReordered={onReordered}
            renderItem={renderItem}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <View style={styles.emptyTrainingContainer}>
          <Text style={styles.noTrainingText}>Нет тренировки на эту дату</Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStartTraining}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.startButtonText}>Начать тренировку</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}