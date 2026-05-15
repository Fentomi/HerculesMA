// src/screens/client/components/ApproachItem.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { trainingStyles as styles } from '../styles/trainingStyles';

export const ApproachItem = ({ approach, index, exerciseType, exerciseId, onToggle, onEdit }) => {
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
      onPress={() => onEdit({ ...approach, exercise_id: exerciseId })}
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