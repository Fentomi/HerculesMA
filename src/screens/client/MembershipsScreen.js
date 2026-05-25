import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView,
  ActivityIndicator, TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
const MembershipCard = ({ item, onPress, onFreeze, onUnfreeze }) => {
  // Используем status_name, если есть, иначе вычисляем по дате
  let statusText = item.status_name;
  let statusStyle = {};
  if (statusText === 'Активен') {
    statusStyle = styles.activeBadge;
  } else if (statusText === 'Заморожен') {
    statusStyle = styles.frozenBadge;
  } else {
    statusStyle = styles.expiredBadge;
    statusText = statusText || 'Закрыт';
  }

  return (
    <TouchableOpacity
      style={[styles.card, (statusText === 'Закрыт') && styles.cardExpired]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.typeName}>{item.membershiptype_name}</Text>
        <Text style={[styles.badge, statusStyle]}>{statusText}</Text>
      </View>
      <View style={styles.cardBody}>
        <DetailRow
          label="Действует до"
          value={item.clientmembership_validuntil
            ? new Date(item.clientmembership_validuntil).toLocaleDateString()
            : 'Бессрочно'}
        />
        {statusText === 'Активен' && (
          <>
            <DetailRow label="Осталось дней" value={Math.ceil(
              (new Date(item.clientmembership_validuntil || Date.now()) - new Date()) / (1000 * 60 * 60 * 24)
            )} />
            {item.membershiptype_freezedays > 0 && (
              <TouchableOpacity style={styles.freezeButton} onPress={() => onFreeze(item)}>
                <Text style={styles.freezeText}>❄️ Заморозить ({item.membershiptype_freezedays} дн.)</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        {statusText === 'Заморожен' && (
          <TouchableOpacity style={styles.unfreezeButton} onPress={() => onUnfreeze(item)}>
            <Text style={styles.unfreezeText}>✅ Разморозить</Text>
          </TouchableOpacity>
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

  // Состояния для заморозки
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [freezeMembership, setFreezeMembership] = useState(null);
  const [freezeStartDate, setFreezeStartDate] = useState(new Date());
  const [plannedUnfreezeDate, setPlannedUnfreezeDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showPlannedPicker, setShowPlannedPicker] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);

  // Состояния для разморозки
  const [unfreezeModalVisible, setUnfreezeModalVisible] = useState(false);
  const [unfreezeMembership, setUnfreezeMembership] = useState(null);
  const [unfreezeDate, setUnfreezeDate] = useState(new Date());
  const [showUnfreezePicker, setShowUnfreezePicker] = useState(false);
  const [unfreezeLoading, setUnfreezeLoading] = useState(false);
  const [freezeRecord, setFreezeRecord] = useState(null);

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

  const formatDateYMD = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Заморозка
  const openFreezeModal = (item) => {
    setFreezeMembership(item);
    setFreezeStartDate(new Date());
    setPlannedUnfreezeDate(null);
    setFreezeModalVisible(true);
  };

  const submitFreeze = async () => {
    if (!freezeMembership) return;
    if (!freezeStartDate) {
      Alert.alert('Ошибка', 'Выберите дату начала заморозки');
      return;
    }
    setFreezeLoading(true);
    try {
      const payload = {
        start_date: formatDateYMD(freezeStartDate),
        planned_unfreeze_date: plannedUnfreezeDate ? formatDateYMD(plannedUnfreezeDate) : null,
      };
      const res = await fetch(`${API_URL}/clients/${clientId}/memberships/${freezeMembership.clientmembership_id}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка заморозки');
      Alert.alert('Успех', 'Абонемент заморожен');
      setFreezeModalVisible(false);
      loadMemberships(); // обновляем список
    } catch (err) {
      Alert.alert('Ошибка', err.message);
    } finally {
      setFreezeLoading(false);
    }
  };

  // Разморозка
  const openUnfreezeModal = async (item) => {
    setUnfreezeMembership(item);
    setUnfreezeDate(new Date());
    setUnfreezeModalVisible(true);
    // Загружаем историю, чтобы получить дату начала заморозки и плановую дату
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/memberships/${item.clientmembership_id}/status-history`);
      if (res.ok) {
        const history = await res.json();
        const activeFreeze = history.find(h => h.status_name === 'Заморожен' && !h.end_date);
        setFreezeRecord(activeFreeze || null);
      } else {
        setFreezeRecord(null);
      }
    } catch (err) {
      console.error(err);
      setFreezeRecord(null);
    }
  };

  const submitUnfreeze = async () => {
    if (!unfreezeMembership) return;
    if (!unfreezeDate) {
      Alert.alert('Ошибка', 'Выберите дату разморозки');
      return;
    }
    setUnfreezeLoading(true);
    try {
      const payload = { date: formatDateYMD(unfreezeDate) };
      const res = await fetch(`${API_URL}/clients/${clientId}/memberships/${unfreezeMembership.clientmembership_id}/freeze`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка разморозки');
      Alert.alert('Успех', 'Абонемент разморожен');
      setUnfreezeModalVisible(false);
      loadMemberships();
    } catch (err) {
      Alert.alert('Ошибка', err.message);
    } finally {
      setUnfreezeLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedType) {
      Alert.alert('Выберите тип абонемента');
      return;
    }
    setBuyLoading(true);
    const start = new Date(activationDate);
    const end = new Date(start);
    end.setDate(end.getDate() + selectedType.membershiptype_activityduration);
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

  // Разделение на активные/замороженные/закрытые для отображения в разных секциях
  const active = memberships.filter(m => m.status_name === 'Активен');
  const frozen = memberships.filter(m => m.status_name === 'Заморожен');
  const closed = memberships.filter(m => m.status_name === 'Закрыт');

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
            <Text style={styles.sectionTitle}>Активные</Text>
            {active.map(item => (
              <MembershipCard
                key={item.clientmembership_id}
                item={item}
                onPress={openDetail}
                onFreeze={openFreezeModal}
                onUnfreeze={openUnfreezeModal}
              />
            ))}
          </>
        )}

        {frozen.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Замороженные</Text>
            {frozen.map(item => (
              <MembershipCard
                key={item.clientmembership_id}
                item={item}
                onPress={openDetail}
                onFreeze={openFreezeModal}
                onUnfreeze={openUnfreezeModal}
              />
            ))}
          </>
        )}

        {closed.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Закрытые</Text>
            {closed.map(item => (
              <MembershipCard
                key={item.clientmembership_id}
                item={item}
                onPress={openDetail}
                onFreeze={openFreezeModal}
                onUnfreeze={openUnfreezeModal}
              />
            ))}
          </>
        )}

        {memberships.length === 0 && (
          <Text style={styles.emptyText}>У вас пока нет абонементов</Text>
        )}
      </ScrollView>

      {/* Модалка покупки (без изменений) */}
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
                    {type.membershiptype_cost} ₽ · {type.membershiptype_activityduration} дн. · {type.membershiptype_visitscount} пос.
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

      {/* Модалка заморозки */}
      <Modal visible={freezeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Заморозка абонемента</Text>
            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
              <Text>Дата начала: {formatDateYMD(freezeStartDate)}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={freezeStartDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) setFreezeStartDate(selectedDate);
                }}
              />
            )}
            <TouchableOpacity onPress={() => setShowPlannedPicker(true)} style={styles.dateButton}>
              <Text>Плановая разморозка (необязательно): {plannedUnfreezeDate ? formatDateYMD(plannedUnfreezeDate) : 'не выбрана'}</Text>
            </TouchableOpacity>
            {showPlannedPicker && (
              <DateTimePicker
                value={plannedUnfreezeDate || freezeStartDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowPlannedPicker(false);
                  if (selectedDate) setPlannedUnfreezeDate(selectedDate);
                }}
              />
            )}
            <View style={styles.pickerButtons}>
              <TouchableOpacity onPress={() => setFreezeModalVisible(false)} style={styles.cancelButton}>
                <Text>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitFreeze} style={styles.submitButton} disabled={freezeLoading}>
                <Text style={styles.submitButtonText}>{freezeLoading ? 'Загрузка...' : 'Заморозить'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Модалка разморозки */}
      <Modal visible={unfreezeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Разморозка абонемента</Text>
            {freezeRecord && (
              <>
                <Text style={styles.infoText}>Начало заморозки: {new Date(freezeRecord.start_date).toLocaleDateString()}</Text>
                {freezeRecord.planned_unfreeze_date && (
                  <Text style={styles.infoText}>Плановая дата: {new Date(freezeRecord.planned_unfreeze_date).toLocaleDateString()}</Text>
                )}
              </>
            )}
            <TouchableOpacity onPress={() => setShowUnfreezePicker(true)} style={styles.dateButton}>
              <Text>Дата разморозки: {formatDateYMD(unfreezeDate)}</Text>
            </TouchableOpacity>
            {showUnfreezePicker && (
              <DateTimePicker
                value={unfreezeDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowUnfreezePicker(false);
                  if (selectedDate) setUnfreezeDate(selectedDate);
                }}
              />
            )}
            <View style={styles.pickerButtons}>
              <TouchableOpacity onPress={() => setUnfreezeModalVisible(false)} style={styles.cancelButton}>
                <Text>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitUnfreeze} style={styles.submitButton} disabled={unfreezeLoading}>
                <Text style={styles.submitButtonText}>{unfreezeLoading ? 'Загрузка...' : 'Разморозить'}</Text>
              </TouchableOpacity>
            </View>
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
  frozenBadge: { backgroundColor: '#FEF3C7', color: '#D97706' },
  expiredBadge: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  cardBody: {},
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { color: '#6B7280', fontSize: 14 },
  detailValue: { fontWeight: '500' },
  freezeButton: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  freezeText: { color: '#D97706', fontSize: 14 },
  unfreezeButton: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  unfreezeText: { color: '#065F46', fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF', fontSize: 16 },
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
  // Стили для модалок заморозки
  pickerModal: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%' },
  pickerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  dateButton: { padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8, marginBottom: 12 },
  infoText: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  pickerButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  submitButton: { padding: 12, backgroundColor: '#4F46E5', borderRadius: 8, flex: 1, marginLeft: 8, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: '600' },
});