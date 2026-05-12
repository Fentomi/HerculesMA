// Генерируем события на апрель-май 2026 (подстрой под текущую дату при тесте)
const today = new Date();
const y = today.getFullYear();
const m = today.getMonth(); // 0-11

function dateStr(day) {
  const d = new Date(y, m, day);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Несколько событий, разбросанных по дням текущего месяца
export const MOCK_EVENTS = [
  {
    id: '1',
    date: dateStr(10),
    time: '09:00',
    title: 'Йога (группа)',
    type: 'group',
    trainer: 'Анна Петрова',
    location: 'Зал 2',
  },
  {
    id: '2',
    date: dateStr(10),
    time: '11:00',
    title: 'Персональная тренировка',
    type: 'individual',
    trainer: 'Иван Сергеев',
    location: 'Зал 1',
  },
  {
    id: '3',
    date: dateStr(12),
    time: '10:00',
    title: 'Пилатес (группа)',
    type: 'group',
    trainer: 'Мария Иванова',
    location: 'Зал 3',
  },
  {
    id: '4',
    date: dateStr(15),
    time: '08:00',
    title: 'Кроссфит (группа)',
    type: 'group',
    trainer: 'Антон Котов',
    location: 'Зал 1',
  },
  {
    id: '5',
    date: dateStr(18),
    time: '14:00',
    title: 'Персональная тренировка',
    type: 'individual',
    trainer: 'Иван Сергеев',
    location: 'Зал 1',
  },
  {
    id: '6',
    date: dateStr(20),
    time: '12:00',
    title: 'Бокс (группа)',
    type: 'group',
    trainer: 'Дмитрий Власов',
    location: 'Ринг',
  },
  {
    id: '7',
    date: dateStr(22),
    time: '17:00',
    title: 'Растяжка (группа)',
    type: 'group',
    trainer: 'Анна Петрова',
    location: 'Зал 2',
  },
  {
    id: '8',
    date: dateStr(25),
    time: '09:00',
    title: 'Персональная тренировка',
    type: 'individual',
    trainer: 'Иван Сергеев',
    location: 'Зал 1',
  },
];