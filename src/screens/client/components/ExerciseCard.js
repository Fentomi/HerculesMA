// src/screens/client/components/ExerciseCard.js
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApproachItem } from './ApproachItem';
import { trainingStyles as styles } from '../styles/trainingStyles';

export const ExerciseCard = ({ 
  exercise, 
  onToggleApproach, 
  onAddApproach, 
  onEditApproach,
  onDeleteExercise,   // новый проп
  onDragStart, 
  onDragEnd, 
  isActive 
}) => {
  const typeName = exercise.type_name || (exercise.type_id === 1 ? 'Вес и повторения' : 'Время и дистанция');
  const isWeightReps = typeName === 'Вес и повторения';
  const header1 = isWeightReps ? 'Вес' : 'Время';
  const header2 = isWeightReps ? 'Повторы' : 'Дистанция';

  const sortedApproaches = [...exercise.approaches].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return a.approache_id - b.approache_id;
  });

  const handleDelete = () => {
    Alert.alert(
      'Удаление упражнения',
      `Вы действительно хотите удалить "${exercise.name}" из тренировки?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => onDeleteExercise(exercise.exercise_id)
        }
      ]
    );
  };

  return (
    <View style={[styles.exerciseCard, isActive && styles.activeCard]}>
      <View style={styles.exerciseHeader}>
        <TouchableOpacity onPressIn={onDragStart} onPressOut={onDragEnd} style={styles.dragHandle}>
          <Ionicons name="menu-outline" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => onAddApproach(exercise)} style={styles.addApproachButton}>
            <Ionicons name="add-circle-outline" size={24} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
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