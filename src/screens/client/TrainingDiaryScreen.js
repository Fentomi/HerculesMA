// src/screens/client/TrainingDiaryScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../constants/api';

// ---------- Вспомогательные функции дат ----------
const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const firstDayOfMonth = (year, month) => {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Пн=0, Вс=6
};
const formatDateYMD = (year, month, day) => {
  const m = (month + 1).toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${year}-${m}-${d}`;
};
const toYMD = (date) => date.toISOString().split('T')[0];

// ---------- Компонент календаря ----------
const Calendar = ({ markedDates, onSelectDate, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const goPrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const goNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const daysCount = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);
  const totalCells = startOffset + daysCount;
  const weeksCount = Math.ceil(totalCells / 7);
  const calendarDays = [];

  // Дни предыдущего месяца
  const prevMonthDate = new Date(year, month, 0);
  const prevMonthDays = prevMonthDate.getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    calendarDays.push({ day, month: month - 1, year: month === 0 ? year - 1 : year, isCurrentMonth: false });
  }
  // Дни текущего месяца
  for (let d = 1; d <= daysCount; d++) {
    calendarDays.push({ day: d, month, year, isCurrentMonth: true });
  }
  // Дни следующего месяца
  const remaining = weeksCount * 7 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({ day: d, month: month + 1, year: month === 11 ? year + 1 : year, isCurrentMonth: false });
  }

  const isSelected = (dayInfo) => {
    return (
      dayInfo.year === selectedDate.getFullYear() &&
      dayInfo.month === selectedDate.getMonth() &&
      dayInfo.day === selectedDate.getDate()
    );
  };

  const handlePressDay = (dayInfo) => {
    if (dayInfo.isCurrentMonth) {
      const newDate = new Date(dayInfo.year, dayInfo.month, dayInfo.day);
      onSelectDate(newDate);
    }
  };

  const dateKey = (dayInfo) => formatDateYMD(dayInfo.year, dayInfo.month, dayInfo.day);

  const rows = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    rows.push(calendarDays.slice(i, i + 7));
  }

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={goPrevMonth}>
          <Text style={styles.arrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {currentMonth.toLocaleString('ru', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={goNextMonth}>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysRow}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      {rows.map((row, idx) => (
        <View key={idx} style={styles.daysRow}>
          {row.map((dayInfo, colIdx) => {
            const ymd = dateKey(dayInfo);
            const hasTraining = markedDates.includes(ymd);
            return (
              <TouchableOpacity
                key={colIdx}
                style={[
                  styles.dayCell,
                  !dayInfo.isCurrentMonth && styles.otherMonthCell,
                  isSelected(dayInfo) && styles.selectedCell,
                ]}
                onPress={() => handlePressDay(dayInfo)}
              >
                <Text style={[styles.dayText, isSelected(dayInfo) && styles.selectedDayText]}>
                  {dayInfo.day}
                </Text>
                {hasTraining && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// ---------- Основной компонент ----------
export default function TrainingDiaryScreen() {
  const { clientId } = useAuth();
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTrainings = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/workout/trainings`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const allTrainings = await response.json();
      // Фильтруем по client_id (явно приводим к числу)
      const numericClientId = Number(clientId);
      const clientTrainings = allTrainings.filter(t => Number(t.client_id) === numericClientId);
      setTrainings(clientTrainings);
    } catch (error) {
      console.error('Ошибка загрузки тренировок:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить тренировки');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useFocusEffect(
    useCallback(() => {
      loadTrainings();
    }, [loadTrainings])
  );

  // Массив уникальных дат YYYY-MM-DD, где есть хотя бы одна тренировка
  const markedDates = [...new Set(
    trainings.map(t => toYMD(new Date(t.start_datetime)))
  )];

  const handleDayPress = (date) => {
    const ymd = toYMD(date);
    // Находим все тренировки за этот день
    const trainingsOnDay = trainings.filter(t => toYMD(new Date(t.start_datetime)) === ymd);
    const trainingId = trainingsOnDay.length > 0 ? trainingsOnDay[0].training_id : null;
    navigation.navigate('Training', {
      date: ymd,
      trainingId,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.headerTitle}>Дневник тренировок</Text>
      <Calendar
        markedDates={markedDates}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          handleDayPress(date);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerTitle: { fontSize: 24, fontWeight: '700', margin: 16, marginBottom: 8, color: '#1A1A1A' },
  calendarContainer: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  arrow: { fontSize: 20, color: '#4F46E5', paddingHorizontal: 16 },
  monthTitle: { fontSize: 18, fontWeight: '600' },
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekDay: { width: '14.28%', textAlign: 'center', fontWeight: '500', color: '#6B7280' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  otherMonthCell: { opacity: 0.3 },
  selectedCell: { backgroundColor: '#4F46E5' },
  dayText: { fontSize: 14, color: '#1A1A1A' },
  selectedDayText: { color: '#fff', fontWeight: '600' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4F46E5', marginTop: 2 },
});