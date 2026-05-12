import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView,
  ActivityIndicator, TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../constants/api';
import MembershipDetailModal from './MembershipDetailModal';

// Вспомогательная строка детали
const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

// Краткая карточка абонемента
const MembershipCard = ({ item, onPress, onFreeze }) => {
  const isActive = item.clientmembership_validuntil
    ? new Date(item.clientmembership_validuntil) >= new Date()
    : true;
  const freezedays = item.membershiptype_freezedays || 0;

  return (
    <TouchableOpacity
      style={[styles.card, !isActive && styles.cardExpired]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.typeName}>{item.membershiptype_name}</Text>
        <Text style={[styles.badge, isActive ? styles.activeBadge : styles.expiredBadge]}>
          {isActive ? 'Активен' : 'Истёк'}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <DetailRow
          label="Действует до"
          value={item.clientmembership_validuntil
            ? new Date(item.clientmembership_validuntil).toLocaleDateString()
            : 'Бессрочно'}
        />
        {isActive && (
          <>
            <DetailRow label="Осталось дней" value={Math.ceil(
              (new Date(item.clientmembership_validuntil || Date.now()) - new Date()) / (1000 * 60 * 60 * 24)
            )} />
            {freezedays > 0 && (
              <TouchableOpacity style={styles.freezeButton} onPress={() => onFreeze(item)}>
                <Text style={styles.freezeText}>❄️ Заморозить ({freezedays} дн.)</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        <DetailRow
          label="Посещений"
          value={`${item.clientmembership_visitscount || 0} / ${item.membershiptype_visitscount || '∞'}`}
        />
        <DetailRow label="Способ оплаты" value={item.paymethod_name} />
      </View>
    </TouchableOpacity>
  );
};

export default function MembershipsScreen() {
  const { clientId } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [activationDate, setActivationDate] = useState(new Date().toISOString().slice(0, 10));
  const [buyLoading, setBuyLoading] = useState(false);
  const [selectedMembershipId, setSelectedMembershipId] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const loadMemberships = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/memberships`);
      const data = await res.json();
      setMemberships(data);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось загрузить абонементы');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useFocusEffect(
    useCallback(() => {
      loadMemberships();
    }, [loadMemberships])
  );

  const loadMembershipTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/membershiptypes`);
      const types = await res.json();
      setMembershipTypes(types);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось загрузить типы абонементов');
    }
  };

  const handleFreeze = (item) => {
    Alert.alert('Заморозка', `Заморозка на ${item.membershiptype_freezedays} дней (заглушка)`);
  };

  const handlePurchase = async () => {
    if (!selectedType) {
      Alert.alert('Выберите тип абонемента');
      return;
    }
    setBuyLoading(true);
    const start = new Date(activationDate);
    const end = new Date(start);
    end.setDate(end.getDate() + selectedType.membershiptype_timeperiod);
    const body = {
      clientMembership_activationDate: activationDate,
      clientmembership_validuntil: end.toISOString().slice(0, 10),
      payMethod_id: 1,
      employee_id: 2,
      membershipType_id: selectedType.membershiptype_id,
      client_id: clientId,
    };
    try {
      const res = await fetch(`${API_URL}/clients/membership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        Alert.alert('Успех', 'Абонемент куплен');
        setShowBuyModal(false);
        loadMemberships();
      } else {
        const err = await res.json();
        Alert.alert('Ошибка', err.error || 'Не удалось купить абонемент');
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Сетевая ошибка');
    } finally {
      setBuyLoading(false);
    }
  };

  const openDetail = (item) => {
    setSelectedMembershipId(item.clientmembership_id);
    setDetailVisible(true);
  };

  const active = memberships.filter(m =>
    m.clientmembership_validuntil ? new Date(m.clientmembership_validuntil) >= new Date() : true
  );
  const expired = memberships.filter(m =>
    m.clientmembership_validuntil ? new Date(m.clientmembership_validuntil) < new Date() : false
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.buyButton} onPress={() => { setShowBuyModal(true); loadMembershipTypes(); }}>
        <Text style={styles.buyButtonText}>+ Купить абонемент</Text>
      </TouchableOpacity>

      <ScrollView style={styles.list}>
        {active.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Активные абонементы</Text>
            {active.map(item => (
              <MembershipCard key={item.clientmembership_id} item={item} onPress={openDetail} onFreeze={handleFreeze} />
            ))}
          </>
        )}

        {expired.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Истекшие абонементы</Text>
            {expired.map(item => (
              <MembershipCard key={item.clientmembership_id} item={item} onPress={openDetail} onFreeze={handleFreeze} />
            ))}
          </>
        )}

        {memberships.length === 0 && (
          <Text style={styles.emptyText}>У вас пока нет абонементов</Text>
        )}
      </ScrollView>

      {/* Модалка покупки */}
      <Modal visible={showBuyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Покупка абонемента</Text>
              <Text style={styles.label}>Тип абонемента:</Text>
              {membershipTypes.map(type => (
                <TouchableOpacity
                  key={type.membershiptype_id}
                  style={[styles.typeOption, selectedType?.membershiptype_id === type.membershiptype_id && styles.selectedType]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={styles.typeName}>{type.membershiptype_name}</Text>
                  <Text style={styles.typeDetails}>
                    {type.membershiptype_cost} ₽ · {type.membershiptype_timeperiod} дн. · {type.membershiptype_visitscount} пос.
                  </Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.label}>Дата начала:</Text>
              <TextInput
                style={styles.input}
                value={activationDate}
                onChangeText={setActivationDate}
                placeholder="YYYY-MM-DD"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setShowBuyModal(false)}>
                  <Text>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handlePurchase} disabled={buyLoading}>
                  {buyLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Оплатить</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <MembershipDetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        membershipId={selectedMembershipId}
        clientId={clientId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  buyButton: { backgroundColor: '#4F46E5', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  buyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: '#4F46E5',
  },
  cardExpired: { borderLeftColor: '#9CA3AF', opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  typeName: { fontSize: 16, fontWeight: '600', flex: 1 },
  badge: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, overflow: 'hidden' },
  activeBadge: { backgroundColor: '#D1FAE5', color: '#065F46' },
  expiredBadge: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  cardBody: {},
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { color: '#6B7280', fontSize: 14 },
  detailValue: { fontWeight: '500' },
  freezeButton: { marginTop: 8, alignSelf: 'flex-start' },
  freezeText: { color: '#4F46E5', fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF', fontSize: 16 },
  // Модалка покупки
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 12 },
  typeOption: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  selectedType: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  typeDetails: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F3F4F6', marginRight: 8 },
  confirmButton: { backgroundColor: '#4F46E5', marginLeft: 8 },
});