import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Modal, ScrollView, ActivityIndicator, LayoutAnimation,
  Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../constants/api';
import ServiceDetailModal from './ServiceDetailModal';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const PurchasedServiceCard = ({ item, isExpired, onPress }) => (
  <TouchableOpacity
    style={[styles.card, isExpired && styles.cardExpired]}
    onPress={() => onPress(item)}
    activeOpacity={0.7}
  >
    <View style={styles.cardHeader}>
      <Text style={styles.serviceName}>{item.service_name}</Text>
      <Text style={[styles.remainingBadge, isExpired ? styles.expiredBadge : styles.activeBadge]}>
        {isExpired ? 'Использована' : `Осталось: ${item.remaining} занятий`}
      </Text>
    </View>
    <View style={styles.cardBody}>
      <DetailRow label="Дата покупки" value={new Date(item.buy_date).toLocaleDateString()} />
      <DetailRow label="Цена" value={`${item.price} ₽`} />
      <DetailRow label="Способ оплаты" value={item.payment_method} />
      {item.trainer && <DetailRow label="Тренер" value={item.trainer} />}
    </View>
  </TouchableOpacity>
);

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export default function ServicesScreen() {
  const { clientId } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpired, setShowExpired] = useState(false);

  // Покупка
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [buyLoading, setBuyLoading] = useState(false);

  // Детальный просмотр
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const loadServices = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/services`);
      const data = await res.json();
      setServices(data);
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось загрузить услуги');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useFocusEffect(
    useCallback(() => { loadServices(); }, [loadServices])
  );

  const activeServices = services.filter(s => s.remaining > 0);
  const expiredServices = services.filter(s => s.remaining === 0);

  const toggleExpired = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowExpired(prev => !prev);
  };

  const loadAvailable = async () => {
    try {
      const res = await fetch(`${API_URL}/services/`);
      const tree = await res.json();
      const groupServices = [];
      tree.forEach(category => {
        if (category.subcategories) {
          category.subcategories.forEach(sub => {
            sub.services.forEach(service => {
              if (!service.trainer_id) {
                groupServices.push({
                  ...service,
                  categoryName: category.name,
                  subcategoryName: sub.name,
                });
              }
            });
          });
        }
      });
      setAvailableServices(groupServices);
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось загрузить каталог услуг');
    }
  };

  const handleBuyPress = () => {
    setShowBuyModal(true);
    loadAvailable();
  };

  const handlePurchase = async () => {
    if (!selectedService) {
      Alert.alert('Выберите услугу');
      return;
    }
    setBuyLoading(true);
    const body = {
      use_count: selectedService.use_count,
      payment_id: 1,
      service_id: selectedService.service_id,
      employee_id: 2,
      trainer_id: null,
    };
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/add_service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        Alert.alert('Успех', 'Услуга приобретена');
        setShowBuyModal(false);
        setSelectedService(null);
        loadServices();
      } else {
        const err = await res.json();
        Alert.alert('Ошибка', err.error || 'Не удалось купить услугу');
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Сетевая ошибка');
    } finally {
      setBuyLoading(false);
    }
  };

  const openDetail = (item) => {
    setSelectedServiceId(item.client_services_id);
    setDetailVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.buyButton} onPress={handleBuyPress}>
        <Text style={styles.buyButtonText}>+ Купить услугу</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeServices.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Активные услуги</Text>
            {activeServices.map(item => (
              <PurchasedServiceCard key={item.client_services_id} item={item} isExpired={false} onPress={openDetail} />
            ))}
          </>
        ) : (
          <Text style={styles.emptyText}>Нет активных услуг</Text>
        )}

        {expiredServices.length > 0 && (
          <View style={styles.expiredSection}>
            <TouchableOpacity style={styles.expiredToggle} onPress={toggleExpired} activeOpacity={0.7}>
              <Text style={styles.expiredToggleText}>
                Использованные услуги ({expiredServices.length})
              </Text>
              <Text style={styles.expiredArrow}>{showExpired ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showExpired && (
              <View style={styles.expiredList}>
                {expiredServices.map(item => (
                  <PurchasedServiceCard key={item.client_services_id} item={item} isExpired={true} onPress={openDetail} />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Модалка покупки (без изменений) */}
      <Modal visible={showBuyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Выберите групповую тренировку</Text>
              {availableServices.map(service => (
                <TouchableOpacity
                  key={service.service_id}
                  style={[styles.serviceOption, selectedService?.service_id === service.service_id && styles.selectedOption]}
                  onPress={() => setSelectedService(service)}
                >
                  <Text style={styles.optionName}>{service.name}</Text>
                  <Text style={styles.optionMeta}>{service.categoryName} / {service.subcategoryName}</Text>
                  <Text style={styles.optionPrice}>{service.price} ₽ · {service.use_count} занятий</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>Персональные тренировки приобретаются только через администратора клуба.</Text>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => { setShowBuyModal(false); setSelectedService(null); }}>
                  <Text>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handlePurchase} disabled={!selectedService || buyLoading}>
                  {buyLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Купить</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ServiceDetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        serviceId={selectedServiceId}
        clientId={clientId}
      />
    </SafeAreaView>
  );
}

// Стили (как раньше, только добавлены стили для карточки и т.д.)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  buyButton: { backgroundColor: '#4F46E5', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  buyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 16, marginTop: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#4F46E5' },
  cardExpired: { borderLeftColor: '#9CA3AF', opacity: 0.8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  serviceName: { fontSize: 16, fontWeight: '600', flex: 1 },
  remainingBadge: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  activeBadge: { backgroundColor: '#D1FAE5', color: '#065F46' },
  expiredBadge: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  cardBody: {},
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  detailLabel: { color: '#6B7280', fontSize: 14 },
  detailValue: { fontWeight: '500' },
  expiredSection: { marginTop: 8 },
  expiredToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  expiredToggleText: { fontSize: 16, fontWeight: '500', color: '#6B7280' },
  expiredArrow: { fontSize: 14, color: '#6B7280' },
  expiredList: { marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  serviceOption: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  selectedOption: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  optionName: { fontSize: 16, fontWeight: '600' },
  optionMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  optionPrice: { fontSize: 14, marginTop: 4, color: '#1A1A1A' },
  infoBox: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, marginVertical: 16 },
  infoText: { fontSize: 14, color: '#92400E', textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F3F4F6', marginRight: 8 },
  confirmButton: { backgroundColor: '#4F46E5', marginLeft: 8 },
});