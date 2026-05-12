import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { MOCK_EVENTS } from '../../data/mockSchedule';
import { SafeAreaView } from 'react-native-safe-area-context';

// Типы верхних табов
const TAB_PERSONAL = 'personal';
const TAB_CLUB = 'club';

// Представления
const VIEW_MONTH = 'month';
const VIEW_WEEK = 'week';
const VIEW_DAY = 'day';

// Вспомогательные функции для дат
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth(); // 0-11
const currentDate = today.getDate();

// Получение дней в месяце
const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
// Получение дня недели первого числа месяца (0 - вс, 1 - пн, ..., 6 - сб)
const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

// Функция для форматирования даты YYYY-MM-DD
const formatDate = (year, month, day) => {
  const m = month < 10 ? '0' + (month + 1) : month + 1;
  const d = day < 10 ? '0' + day : day;
  return `${year}-${m}-${d}`;
};

// Получение начала недели (понедельник) для заданной даты
const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // корректировка на вс
  return new Date(d.setDate(diff));
};

// Компонент переключателя представлений (месяц/неделя/день)
const ViewSwitcher = ({ currentView, onChange }) => (
  <View style={styles.viewSwitcher}>
    <TouchableOpacity
      style={[styles.viewButton, currentView === VIEW_MONTH && styles.viewButtonActive]}
      onPress={() => onChange(VIEW_MONTH)}
    >
      <Text style={[styles.viewButtonText, currentView === VIEW_MONTH && styles.viewButtonTextActive]}>
        Месяц
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.viewButton, currentView === VIEW_WEEK && styles.viewButtonActive]}
      onPress={() => onChange(VIEW_WEEK)}
    >
      <Text style={[styles.viewButtonText, currentView === VIEW_WEEK && styles.viewButtonTextActive]}>
        Неделя
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.viewButton, currentView === VIEW_DAY && styles.viewButtonActive]}
      onPress={() => onChange(VIEW_DAY)}
    >
      <Text style={[styles.viewButtonText, currentView === VIEW_DAY && styles.viewButtonTextActive]}>
        День
      </Text>
    </TouchableOpacity>
  </View>
);

// Карточка события
const EventCard = ({ event }) => (
  <View style={styles.eventCard}>
    <Text style={styles.eventTime}>{event.time}</Text>
    <View style={styles.eventDetails}>
      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.eventTrainer}>{event.trainer}</Text>
      <Text style={styles.eventLocation}>{event.location}</Text>
    </View>
    <View style={[styles.eventTypeBadge, event.type === 'individual' ? styles.individualBadge : styles.groupBadge]}>
      <Text style={styles.badgeText}>{event.type === 'individual' ? 'Перс.' : 'Групп.'}</Text>
    </View>
  </View>
);

// Представление "Месяц"
const MonthView = ({ events, selectedDate, onSelectDate, scheduleType }) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysCount = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month); // 0-6 (вс-сб)
  // Корректируем: хотим, чтобы неделя начиналась с понедельника (Пн-Вс), календарь как в РФ.
  // Сделаем массив дней, начиная с предыдущего месяца, чтобы заполнить ячейки.
  const prevMonthDays = startDay === 0 ? 6 : startDay - 1; // если startDay 0 (вс), нужно 6 дней с прошлого месяца, иначе startDay-1
  const totalCells = prevMonthDays + daysCount;
  const weeksCount = Math.ceil(totalCells / 7);
  const calendarDays = [];

  // Дни предыдущего месяца
  const prevMonthDate = new Date(year, month, 0); // последний день предыдущего месяца
  const prevMonthLastDay = prevMonthDate.getDate();
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    calendarDays.push({ day, month: month - 1, year: month === 0 ? year - 1 : year, isCurrentMonth: false });
  }
  // Дни текущего месяца
  for (let d = 1; d <= daysCount; d++) {
    calendarDays.push({ day: d, month, year, isCurrentMonth: true });
  }
  // Дни следующего месяца
  const remainingCells = weeksCount * 7 - calendarDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    calendarDays.push({ day: d, month: month + 1, year: month === 11 ? year + 1 : year, isCurrentMonth: false });
  }

  // Функция проверки, совпадает ли день календаря с выбранной датой
  const isSelectedDay = (dayInfo) => {
    return (
      dayInfo.year === selectedDate.getFullYear() &&
      dayInfo.month === selectedDate.getMonth() &&
      dayInfo.day === selectedDate.getDate()
    );
  };

  // Получить события для конкретного дня (по типу отображения)
  const getEventsForDay = (dayInfo) => {
    if (!dayInfo.isCurrentMonth) return [];
    const dateStr = formatDate(dayInfo.year, dayInfo.month, dayInfo.day);
    return events.filter((ev) => ev.date === dateStr && (scheduleType === TAB_CLUB ? ev.type === 'group' : true));
  };

  // События для выбранного дня (чтобы показать под календарем)
  const selectedDateStr = formatDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const selectedDayEvents = events.filter(
    (ev) => ev.date === selectedDateStr && (scheduleType === TAB_CLUB ? ev.type === 'group' : true)
  );

  const renderDayCell = (dayInfo, index) => {
    const hasEvents = getEventsForDay(dayInfo).length > 0;
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          !dayInfo.isCurrentMonth && styles.otherMonthDay,
          isSelectedDay(dayInfo) && styles.selectedDayCell,
        ]}
        onPress={() => {
          if (dayInfo.isCurrentMonth) {
            const newDate = new Date(dayInfo.year, dayInfo.month, dayInfo.day);
            onSelectDate(newDate);
          }
        }}
      >
        <Text style={[styles.dayText, isSelectedDay(dayInfo) && styles.selectedDayText]}>
          {dayInfo.day}
        </Text>
        {hasEvents && <View style={styles.eventDot} />}
      </TouchableOpacity>
    );
  };

  // Разбиваем calendarDays на строки по 7 дней
  const rows = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    rows.push(calendarDays.slice(i, i + 7));
  }

  return (
    <View style={styles.monthContainer}>
      {/* Заголовок с месяцем и годом */}
      <Text style={styles.monthTitle}>
        {selectedDate.toLocaleString('ru', { month: 'long', year: 'numeric' })}
      </Text>
      {/* Дни недели */}
      <View style={styles.weekDaysRow}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
          <Text key={day} style={styles.weekDayLabel}>
            {day}
          </Text>
        ))}
      </View>
      {/* Сетка календаря */}
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.daysRow}>
          {row.map((dayInfo, colIndex) => renderDayCell(dayInfo, rowIndex * 7 + colIndex))}
        </View>
      ))}
      {/* Список событий выбранного дня */}
      <View style={styles.selectedDayEvents}>
        <Text style={styles.eventsListTitle}>
          {selectedDate.toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
        </Text>
        {selectedDayEvents.length > 0 ? (
          selectedDayEvents.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <Text style={styles.noEvents}>Нет занятий</Text>
        )}
      </View>
    </View>
  );
};

// Представление "Неделя"
const WeekView = ({ events, selectedDate, onSelectDate, scheduleType }) => {
  const monday = getMonday(selectedDate);
  // Генерируем дни недели от понедельника
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDays.push(day);
  }

  const selectedDateStr = formatDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  // События выбранного дня
  const dayEvents = events.filter(
    (ev) => ev.date === selectedDateStr && (scheduleType === TAB_CLUB ? ev.type === 'group' : true)
  );

  return (
    <View style={styles.weekContainer}>
      {/* Горизонтальная полоса дней недели */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekDaysScroll}>
        {weekDays.map((date) => {
          const isActive =
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[styles.weekDayButton, isActive && styles.weekDayButtonActive]}
              onPress={() => onSelectDate(date)}
            >
              <Text style={[styles.weekDayName, isActive && styles.weekDayNameActive]}>
                {date.toLocaleString('ru', { weekday: 'short' })}
              </Text>
              <Text style={[styles.weekDayNumber, isActive && styles.weekDayNumberActive]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {/* События выбранного дня */}
      <View style={styles.dayEventsList}>
        <Text style={styles.eventsListTitle}>
          {selectedDate.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        {dayEvents.length > 0 ? (
          dayEvents.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <Text style={styles.noEvents}>Нет занятий</Text>
        )}
      </View>
    </View>
  );
};

// Представление "День"
const DayView = ({ events, selectedDate, scheduleType }) => {
  const selectedDateStr = formatDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const dayEvents = events.filter(
    (ev) => ev.date === selectedDateStr && (scheduleType === TAB_CLUB ? ev.type === 'group' : true)
  );

  return (
    <View style={styles.dayContainer}>
      <Text style={styles.dayTitle}>
        {selectedDate.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>
      {dayEvents.length > 0 ? (
        dayEvents.map((event) => <EventCard key={event.id} event={event} />)
      ) : (
        <Text style={styles.noEvents}>Нет занятий</Text>
      )}
    </View>
  );
};

// Основной экран Расписания
export default function ScheduleScreen() {
  const [scheduleType, setScheduleType] = useState(TAB_PERSONAL); // личное / клуб
  const [currentView, setCurrentView] = useState(VIEW_WEEK); // по умолчанию неделя
  const [selectedDate, setSelectedDate] = useState(new Date()); // текущая дата

  // Фильтруем события один раз, но в компонентах они дополнительно фильтруются по дате
  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS; // пока без фильтрации, потому что фильтрация по типу будет в самих представлениях
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
        {/* Верхние вкладки "Наше расписание" / "Клуб" */}
        <View style={styles.tabContainer}>
            <TouchableOpacity
            style={[styles.tab, scheduleType === TAB_PERSONAL && styles.activeTab]}
            onPress={() => setScheduleType(TAB_PERSONAL)}
            >
            <Text style={[styles.tabText, scheduleType === TAB_PERSONAL && styles.activeTabText]}>
                Наше расписание
            </Text>
            </TouchableOpacity>
            <TouchableOpacity
            style={[styles.tab, scheduleType === TAB_CLUB && styles.activeTab]}
            onPress={() => setScheduleType(TAB_CLUB)}
            >
            <Text style={[styles.tabText, scheduleType === TAB_CLUB && styles.activeTabText]}>
                Расписание клуба
            </Text>
            </TouchableOpacity>
        </View>

        {/* Переключатель вида */}
        <ViewSwitcher currentView={currentView} onChange={setCurrentView} />

        {/* В зависимости от выбранного вида рендерим тот или иной компонент */}
        {currentView === VIEW_MONTH && (
            <MonthView
            events={filteredEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            scheduleType={scheduleType}
            />
        )}
        {currentView === VIEW_WEEK && (
            <WeekView
            events={filteredEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            scheduleType={scheduleType}
            />
        )}
        {currentView === VIEW_DAY && (
            <DayView
            events={filteredEvents}
            selectedDate={selectedDate}
            scheduleType={scheduleType}
            />
        )}
    </SafeAreaView>
  );
}

// Стили
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  viewSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  viewButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  viewButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  viewButtonTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  // Карточка события
  eventCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginRight: 16,
    width: 50,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  eventTrainer: {
    fontSize: 14,
    color: '#4F46E5',
  },
  eventLocation: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  eventTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  individualBadge: {
    backgroundColor: '#FEF3C7',
  },
  groupBadge: {
    backgroundColor: '#DBEAFE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  // Месяц
  monthContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  weekDayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  selectedDayCell: {
    backgroundColor: '#4F46E5',
  },
  dayText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '600',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F46E5',
    marginTop: 2,
  },
  selectedDayEvents: {
    marginTop: 16,
  },
  eventsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  noEvents: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 20,
  },
  // Неделя
  weekContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  weekDaysScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  weekDayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 70,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  weekDayButtonActive: {
    backgroundColor: '#4F46E5',
  },
  weekDayName: {
    fontSize: 12,
    color: '#6B7280',
  },
  weekDayNameActive: {
    color: '#fff',
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 4,
  },
  weekDayNumberActive: {
    color: '#fff',
  },
  dayEventsList: {
    flex: 1,
  },
  // День
  dayContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginLeft: 4,
  },
});