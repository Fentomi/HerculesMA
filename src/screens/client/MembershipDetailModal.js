import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import QRCode from 'react-native-qrcode-svg';
import { API_URL } from '../../constants/api';

const PAGE_SIZE = 5;

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const MembershipDetailModal = ({ visible, onClose, membershipId, clientId }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // Состояния для заморозки
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [freezeStartDate, setFreezeStartDate] = useState(new Date());
  const [plannedUnfreezeDate, setPlannedUnfreezeDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showPlannedPicker, setShowPlannedPicker] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);

  // Состояния для разморозки
  const [unfreezeModalVisible, setUnfreezeModalVisible] = useState(false);
  const [unfreezeDate, setUnfreezeDate] = useState(new Date());
  const [showUnfreezePicker, setShowUnfreezePicker] = useState(false);
  const [unfreezeLoading, setUnfreezeLoading] = useState(false);
  const [freezeRecord, setFreezeRecord] = useState(null); // активная запись заморозки

  // Состояния для истории статусов
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!clientId || !membershipId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/memberships_with_visits/${membershipId}`);
      if (!res.ok) {
        throw new Error('Ошибка загрузки');
      }
      const data = await res.json();
      setDetail(data);
      setCurrentPage(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [clientId, membershipId]);

  useEffect(() => {
    if (visible) {
      loadDetail();
    } else {
      setDetail(null);
      setError(null);
      setCurrentPage(1);
      setQrModalVisible(false);
      setFreezeModalVisible(false);
      setUnfreezeModalVisible(false);
      setHistoryModalVisible(false);
    }
  }, [visible, loadDetail]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateYMD = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const visits = detail?.visits || [];
  const totalPages = Math.ceil(visits.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const currentVisits = visits.slice(startIdx, startIdx + PAGE_SIZE);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleShowQr = () => {
    setQrModalVisible(true);
  };

  // Заморозка
  const openFreezeModal = () => {
    setFreezeStartDate(new Date());
    setPlannedUnfreezeDate(null);
    setFreezeModalVisible(true);
  };

  const submitFreeze = async () => {
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
      const res = await fetch(`${API_URL}/clients/${clientId}/memberships/${membershipId}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка заморозки');
      }
      Alert.alert('Успех', 'Абонемент заморожен');
      setFreezeModalVisible(false);
      loadDetail(); // перезагружаем данные
    } catch (err) {
      Alert.alert('Ошибка', err.message);
    } finally {
      setFreezeLoading(false);
    }
  };

  // Разморозка: сначала загружаем активную запись заморозки
  const openUnfreezeModal = async () => {
    setUnfreezeDate(new Date());
    setUnfreezeModalVisible(true);
    // Загружаем историю, чтобы найти последнюю незакрытую заморозку
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/memberships/${membershipId}/status-history`);
      if (res.ok) {
        const history = await res.json();
        const activeFreeze = history.find(h => h.status_name === 'Заморожен' && !h.end_date);
        setFreezeRecord(activeFreeze || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitUnfreeze = async () => {
    if (!unfreezeDate) {
      Alert.alert('Ошибка', 'Выберите дату разморозки');
      return;
    }
    setUnfreezeLoading(true);
    try {
      const payload = { date: formatDateYMD(unfreezeDate) };
      const res = await fetch(`${API_URL}/clients/${clientId}/memberships/${membershipId}/freeze`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка разморозки');
      }
      Alert.alert('Успех', 'Абонемент разморожен');
      setUnfreezeModalVisible(false);
      loadDetail();
    } catch (err) {
      Alert.alert('Ошибка', err.message);
    } finally {
      setUnfreezeLoading(false);
    }
  };

  // История статусов
  const openHistoryModal = async () => {
    setHistoryLoading(true);
    setHistoryModalVisible(true);
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/memberships/${membershipId}/status-history`);
      if (!res.ok) throw new Error('Ошибка загрузки истории');
      const data = await res.json();
      setHistoryList(data);
    } catch (err) {
      Alert.alert('Ошибка', err.message);
      setHistoryModalVisible(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const currentStatus = detail?.status_name;

  return (
    <>
      {/* Основное модальное окно с деталями */}
      <Modal visible={visible} animationType="slide" transparent>
        <SafeAreaView style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Детали абонемента</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : detail ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailCard}>
                  <View style={styles.typeHeader}>
                    <Text style={styles.typeName}>{detail.membershiptype_name}</Text>
                    <TouchableOpacity onPress={handleShowQr} style={styles.qrIcon}>
                      <Text style={styles.qrIconText}>📱 QR</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cost}>{detail.membershiptype_cost} ₽</Text>

                  <DetailRow label="Дата покупки" value={formatDate(detail.clientmembership_buydate)} />
                  <DetailRow label="Активация" value={formatDate(detail.clientmembership_activationdate)} />
                  <DetailRow
                    label="Действует до"
                    value={detail.clientmembership_validuntil ? formatDate(detail.clientmembership_validuntil) : 'Бессрочно'}
                  />
                  <DetailRow
                    label="Посещения"
                    value={`${detail.clientmembership_visitscount || 0} / ${detail.total_visits_allowed || '∞'}`}
                  />
                </View>

                {/* Блок управления заморозкой */}
                <View style={styles.actionsContainer}>
                  {currentStatus === 'Активен' && (
                    <TouchableOpacity style={styles.actionButton} onPress={openFreezeModal}>
                      <Text style={styles.actionButtonText}>❄️ Заморозить</Text>
                    </TouchableOpacity>
                  )}
                  {currentStatus === 'Заморожен' && (
                    <TouchableOpacity style={styles.actionButton} onPress={openUnfreezeModal}>
                      <Text style={styles.actionButtonText}>✅ Разморозить</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.actionButton, styles.historyButton]} onPress={openHistoryModal}>
                    <Text style={styles.actionButtonText}>📜 История статусов</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>История посещений</Text>

                {visits.length === 0 ? (
                  <Text style={styles.noVisits}>Нет записей о посещениях</Text>
                ) : (
                  <>
                    {currentVisits.map((visit, index) => (
                      <View key={startIdx + index} style={styles.visitCard}>
                        <DetailRow
                          label="Вход"
                          value={visit.visit_datetime ? new Date(visit.visit_datetime).toLocaleString() : '—'}
                        />
                        <DetailRow
                          label="Выход"
                          value={visit.exit_datetime ? new Date(visit.exit_datetime).toLocaleString() : '—'}
                        />
                        {visit.notes ? <DetailRow label="Заметка" value={visit.notes} /> : null}
                      </View>
                    ))}

                    {totalPages > 1 && (
                      <View style={styles.pagination}>
                        <TouchableOpacity
                          style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                          onPress={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>
                            ← Назад
                          </Text>
                        </TouchableOpacity>

                        <Text style={styles.pageIndicator}>
                          {currentPage} / {totalPages}
                        </Text>

                        <TouchableOpacity
                          style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                          onPress={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonTextDisabled]}>
                            Вперёд →
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Модальное окно заморозки */}
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

      {/* Модальное окно разморозки */}
      <Modal visible={unfreezeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Разморозка абонемента</Text>
            {freezeRecord && (
              <>
                <Text style={styles.infoText}>Начало заморозки: {formatDate(freezeRecord.start_date)}</Text>
                {freezeRecord.planned_unfreeze_date && (
                  <Text style={styles.infoText}>Плановая дата: {formatDate(freezeRecord.planned_unfreeze_date)}</Text>
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

      {/* Модальное окно истории статусов */}
      <Modal visible={historyModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>История статусов</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {historyLoading ? (
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
            ) : historyList.length === 0 ? (
              <Text style={styles.noVisits}>Нет записей</Text>
            ) : (
              <ScrollView>
                {historyList.map((item, idx) => (
                  <View key={idx} style={styles.historyItem}>
                    <Text style={styles.historyStatus}>{item.status_name}</Text>
                    <Text>С: {formatDate(item.start_date)}</Text>
                    {item.planned_unfreeze_date && <Text>Плановая разморозка: {formatDate(item.planned_unfreeze_date)}</Text>}
                    {item.end_date && <Text>По: {formatDate(item.end_date)}</Text>}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Модальное окно с QR-кодом (остаётся без изменений) */}
      <Modal visible={qrModalVisible} animationType="fade" transparent>
        <SafeAreaView style={styles.qrOverlay}>
          <View style={styles.qrModal}>
            <View style={styles.qrHeader}>
              <Text style={styles.qrTitle}>QR-код абонемента</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.qrContent}>
              {detail?.qr_data ? (
                <>
                  <QRCode value={detail.qr_data} size={250} backgroundColor="white" color="black" />
                  <Text style={styles.qrSubtext}>{detail.membershiptype_name}</Text>
                  <Text style={styles.qrData}>{detail.qr_data}</Text>
                </>
              ) : (
                <Text style={styles.error}>QR-код для этого абонемента не сгенерирован</Text>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700' },
  closeBtn: { fontSize: 20, color: '#6B7280', padding: 8 },
  detailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeName: { fontSize: 20, fontWeight: '700', flex: 1 },
  qrIcon: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4F46E5',
    borderRadius: 20,
  },
  qrIconText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cost: { fontSize: 18, color: '#4F46E5', fontWeight: '600', marginBottom: 12 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: { color: '#6B7280', fontSize: 14 },
  detailValue: { fontWeight: '500' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginHorizontal: 4,
  },
  historyButton: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  visitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
  },
  noVisits: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 20,
  },
  error: { textAlign: 'center', color: 'red', marginTop: 20 },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
  },
  pageButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  pageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  pageButtonTextDisabled: {
    color: '#9CA3AF',
  },
  pageIndicator: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    width: '90%',
    maxWidth: 350,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrTitle: { fontSize: 18, fontWeight: '700' },
  qrContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  qrSubtext: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  qrData: {
    marginTop: 12,
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateButton: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    padding: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  submitButton: {
    padding: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  historyItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default MembershipDetailModal;