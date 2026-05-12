import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const loadDetail = useCallback(async () => {
    if (!clientId || !membershipId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/memberships/${membershipId}`);
      if (!res.ok) {
        throw new Error('Ошибка загрузки');
      }
      const data = await res.json();
      setDetail(data);
      setCurrentPage(1); // сброс на первую страницу при загрузке
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
    }
  }, [visible, loadDetail]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
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

  return (
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
                <Text style={styles.typeName}>{detail.membershiptype_name}</Text>
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

              <Text style={styles.sectionTitle}>История посещений</Text>

              {visits.length === 0 ? (
                <Text style={styles.noVisits}>Нет записей о посещениях</Text>
              ) : (
                <>
                  {/* Таблица посещений текущей страницы */}
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

                  {/* Пагинация */}
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
  typeName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
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
});

export default MembershipDetailModal;