// src/screens/client/TrainingScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../constants/api';

const toYMD = (date) => date.toISOString().split('T')[0];

// Компонент одного подхода – клик по строке открывает редактирование
const ApproachItem = ({ approach, index, exerciseType, exerciseId, onToggle, onEdit }) => {
  const isWeightReps = exerciseType === 'Вес и повторения';
  const isTimeDist = exerciseType === 'Время и дистанция';

  const renderMetric1 = () => {
    if (isWeightReps) {
      const weight = approach.weigth ? `${approach.weigth} кг` : '—';
      return <Text style={styles.metricValue}>{weight}</Text>;
    }
    if (isTimeDist) {
      const time = approach.time ? `${approach.time} сек` : '—';
      return <Text style={styles.metricValue}>{time}</Text>;
    }
    return <Text style={styles.metricValue}>—</Text>;
  };

  const renderMetric2 = () => {
    if (isWeightReps) {
      const reps = approach.repetitions ? `${approach.repetitions}` : '—';
      return <Text style={styles.metricValue}>{reps}</Text>;
    }
    if (isTimeDist) {
      const dist = approach.distance ? `${approach.distance} м` : '—';
      return <Text style={styles.metricValue}>{dist}</Text>;
    }
    return <Text style={styles.metricValue}>—</Text>;
  };

  const header1 = isWeightReps ? 'Вес' : 'Время';
  const header2 = isWeightReps ? 'Повторы' : 'Дистанция';

  return (
    <TouchableOpacity
      onPress={() => {
        // Передаём подход с exercise_id в редактор
        onEdit({ ...approach, exercise_id: exerciseId });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.approachRow}>
        <Text style={styles.approachNumber}>{index + 1}</Text>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>{header1}</Text>
          {renderMetric1()}
        </View>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>{header2}</Text>
          {renderMetric2()}
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onToggle(approach.approache_id, approach.is_done);
          }}
          style={styles.checkbox}
        >
          <Ionicons
            name={approach.is_done ? 'checkbox' : 'square-outline'}
            size={24}
            color={approach.is_done ? '#4F46E5' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Карточка упражнения
const ExerciseCard = ({ exercise, onToggleApproach, onAddApproach, onEditApproach }) => {
  const typeName = exercise.type_name || (exercise.type_id === 1 ? 'Вес и повторения' : 'Время и дистанция');
  const isWeightReps = typeName === 'Вес и повторения';
  const header1 = isWeightReps ? 'Вес' : 'Время';
  const header2 = isWeightReps ? 'Повторы' : 'Дистанция';

  // Сортируем подходы по времени (или по id) для стабильного порядка
  const sortedApproaches = [...exercise.approaches].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return a.approache_id - b.approache_id;
  });

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <TouchableOpacity onPress={() => onAddApproach(exercise)} style={styles.addApproachButton}>
          <Ionicons name="add-circle-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>
      <View style={styles.approachHeader}>
        <Text style={styles.headerNumber}>#</Text>
        <Text style={styles.headerMetric}>{header1}</Text>
        <Text style={styles.headerMetric}>{header2}</Text>
        <Text style={styles.headerDone}>Сделано</Text>
      </View>
      {sortedApproaches.map((approach, idx) => (
        <ApproachItem
          key={approach.approache_id}
          approach={approach}
          index={idx}
          exerciseType={typeName}
          exerciseId={exercise.exercise_id}
          onToggle={onToggleApproach}
          onEdit={onEditApproach}
        />
      ))}
    </View>
  );
};

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
      setExercises(data);
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
      // Локальное обновление без перезагрузки
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

  // Инициализация
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

  // Обновляем тренировку при возврате из редактора (только если нужно)
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
    Alert.alert('Добавить', 'Выберите упражнение из списка (будет позже)');
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
        <ScrollView contentContainerStyle={styles.content}>
          {exercises.length === 0 ? (
            <Text style={styles.emptyText}>Нет упражнений в этой тренировке</Text>
          ) : (
            exercises.map(ex => (
              <ExerciseCard
                key={ex.exercise_id}
                exercise={ex}
                onToggleApproach={toggleApproach}
                onAddApproach={openAddApproach}
                onEditApproach={openEditApproach}
              />
            ))
          )}
        </ScrollView>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logo: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  headerIcons: { flexDirection: 'row' },
  iconButton: { marginLeft: 16 },
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  navArrow: { padding: 8 },
  dateText: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  content: { padding: 16, paddingBottom: 32 },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', flex: 1 },
  addApproachButton: { padding: 4 },
  approachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  headerNumber: { width: 30, fontWeight: '600', color: '#6B7280' },
  headerMetric: { flex: 1, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  headerDone: { width: 60, textAlign: 'center', fontWeight: '600', color: '#6B7280' },
  approachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  approachNumber: { width: 30, fontWeight: '500', color: '#1A1A1A' },
  metricContainer: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 10, color: '#9CA3AF', marginBottom: 2 },
  metricValue: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  checkbox: { width: 60, alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF' },
  emptyTrainingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noTrainingText: { fontSize: 16, color: '#6B7280', marginBottom: 20 },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});