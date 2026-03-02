import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'iiko_sessions';
const PRICE_PER_HOUR = 2500; // ТГ за час
const CURRENCY = 'ТГ';
const NUM_TABLES = 10;

const DRINKS = [
  { name: 'Кофе', price: 750 },
  { name: 'Чай', price: 400 },
  { name: 'Сок', price: 600 },
  { name: 'Вода', price: 300 },
  { name: 'Газировка', price: 450 },
];

const DISHES = [
  { name: 'Пицца', price: 1750 },
  { name: 'Салат', price: 1000 },
  { name: 'Суп', price: 900 },
  { name: 'Бургер', price: 1400 },
  { name: 'Десерт', price: 750 },
];

const initialTable = () => ({
  running: false,
  startTime: null,
  lastSession: { time: 0, cost: 0 },
  order: [],
});

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

function calcBilliardCost(ms, pricePerHour) {
  const hours = ms / (1000 * 60 * 60);
  return Math.ceil(hours * pricePerHour);
}

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn(e);
  }
}

function getTotalsByPeriod(sessions, selectedDateStr) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

  let today = 0;
  let month = 0;
  let year = 0;
  let selected = 0;

  let selectedStart = null;
  let selectedEnd = null;

  if (selectedDateStr) {
    const d = new Date(selectedDateStr);
    selectedStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    selectedEnd = selectedStart + 24 * 60 * 60 * 1000;
  }

  sessions.forEach((s) => {
    const t = new Date(s.date).getTime();
    const total = s.billiardCost + s.barCost;
    if (t >= todayStart) today += total;
    if (t >= monthStart) month += total;
    if (t >= yearStart) year += total;
    if (selectedStart != null && t >= selectedStart && t < selectedEnd) {
      selected += total;
    }
  });

  return { today, month, year, selected };
}

export default function Iiko() {
  const { user, logout } = useAuth();
  const [tables, setTables] = useState(() =>
    Array.from({ length: NUM_TABLES }, initialTable)
  );
  const [expandedTable, setExpandedTable] = useState(null);
  const [sessions, setSessions] = useState(loadSessions);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  const anyRunning = tables.some((t) => t.running);

  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => setTables((prev) => [...prev]), 1000);
    return () => clearInterval(id);
  }, [anyRunning]);

  const getDisplayMs = (table, index) => {
    if (table.running && table.startTime != null) {
      return Date.now() - table.startTime;
    }
    return table.lastSession.time;
  };

  const orderTotal = (order) =>
    order.reduce((sum, row) => sum + row.price * row.quantity, 0);

  const handleStart = (index) => {
    setTables((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, running: true, startTime: Date.now() } : t
      )
    );
  };

  const handleStop = (index) => {
    const table = tables[index];
    if (!table.running) return;
    const elapsed = Date.now() - table.startTime;
    const billiardCost = calcBilliardCost(elapsed, PRICE_PER_HOUR);
    const barCost = orderTotal(table.order);

    const newSession = {
      date: new Date().toISOString(),
      tableIndex: index,
      billiardCost,
      barCost,
    };

    setSessions((prev) => {
      const next = [...prev, newSession];
      saveSessions(next);
      return next;
    });

    setTables((prev) =>
      prev.map((t, i) =>
        i === index
          ? {
              ...t,
              running: false,
              startTime: null,
              lastSession: { time: elapsed, cost: billiardCost },
            }
          : t
      )
    );
  };

  const handleReset = (index) => {
    setTables((prev) =>
      prev.map((t, i) =>
        i === index
          ? {
              ...t,
              running: false,
              startTime: null,
              lastSession: { time: 0, cost: 0 },
              order: [],
            }
          : t
      )
    );
  };

  const addToOrder = (tableIndex, item, category) => {
    setTables((prev) =>
      prev.map((t, i) => {
        if (i !== tableIndex) return t;
        const order = [...t.order];
        const found = order.find(
          (x) => x.name === item.name && x.category === category
        );
        if (found) {
          return {
            ...t,
            order: order.map((x) =>
              x === found ? { ...x, quantity: x.quantity + 1 } : x
            ),
          };
        }
        return {
          ...t,
          order: [...order, { ...item, category, quantity: 1 }],
        };
      })
    );
  };

  const removeFromOrder = (tableIndex, orderIndex) => {
    setTables((prev) =>
      prev.map((t, i) =>
        i === tableIndex
          ? { ...t, order: t.order.filter((_, j) => j !== orderIndex) }
          : t
      )
    );
  };

  const changeQuantity = (tableIndex, orderIndex, delta) => {
    setTables((prev) =>
      prev.map((t, i) => {
        if (i !== tableIndex) return t;
        return {
          ...t,
          order: t.order
            .map((row, j) => {
              if (j !== orderIndex) return row;
              const q = row.quantity + delta;
              if (q < 1) return null;
              return { ...row, quantity: q };
            })
            .filter(Boolean),
        };
      })
    );
  };

  const totals = getTotalsByPeriod(sessions, selectedDate);
  const now = new Date();
  const todayStr = now.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const monthStr = now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const yearStr = String(now.getFullYear());
  const selectedDateLabel = selectedDate
    ? new Date(selectedDate).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'дата не выбрана';

  return (
    <div className="dashboard iiko-page iiko-tables">
      <header className="dashboard-header">
        <h1>iiko — Бильярд</h1>
        <div className="header-actions">
          <Link to="/" className="btn-link">
            Заказ
          </Link>
          <button type="button" className="btn-logout" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <p className="dashboard-user">
          <strong>{user?.email}</strong>
          {user?.name && <> · {user.name}</>}
        </p>
        <p className="iiko-price-note">
          Бильярд: {PRICE_PER_HOUR} {CURRENCY} / час
        </p>

        <div className="iiko-summary-wrap">
          <button
            type="button"
            className="btn-summary"
            onClick={() => setSummaryOpen((v) => !v)}
          >
            {summaryOpen ? '▲ Свернуть сводку' : 'Сводка: день / месяц / год ▼'}
          </button>
          {summaryOpen && (
            <div className="iiko-summary-block">
              <div className="summary-row">
                <span>За сегодня ({todayStr})</span>
                <strong>{totals.today.toLocaleString('ru-RU')} {CURRENCY}</strong>
              </div>
              <div className="summary-row">
                <span>За этот месяц ({monthStr})</span>
                <strong>{totals.month.toLocaleString('ru-RU')} {CURRENCY}</strong>
              </div>
              <div className="summary-row">
                <span>
                  За выбранную дату ({selectedDateLabel}){' '}
                  <input
                    type="date"
                    className="summary-date-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </span>
                <strong>{totals.selected.toLocaleString('ru-RU')} {CURRENCY}</strong>
              </div>
              <div className="summary-row summary-row-total">
                <span>За этот год ({yearStr})</span>
                <strong>{totals.year.toLocaleString('ru-RU')} {CURRENCY}</strong>
              </div>
            </div>
          )}
        </div>

        <section className="iiko-tables-grid">
          {tables.map((table, index) => {
            const displayMs = getDisplayMs(table, index);
            const billiardCost = table.running
              ? calcBilliardCost(displayMs, PRICE_PER_HOUR)
              : table.lastSession.cost;
            const barTotal = orderTotal(table.order);
            const totalSum = billiardCost + barTotal;
            const isExpanded = expandedTable === index;

            return (
              <div
                key={index}
                className={`billiard-card ${isExpanded ? 'billiard-card-expanded' : ''}`}
              >
                <div className="billiard-card-header">
                  <span className="billiard-icon">🎱</span>
                  <h2>Стол №{index + 1}</h2>
                </div>

                <div className="timer-block">
                  <div className="timer-label">Время</div>
                  <div
                    className={`timer-value ${table.running ? 'timer-running' : ''}`}
                  >
                    {formatTime(displayMs)}
                  </div>
                </div>

                <div className="start-stop-row">
                  <button
                    type="button"
                    className="btn-start"
                    onClick={() => handleStart(index)}
                    disabled={table.running}
                  >
                    Старт
                  </button>
                  <button
                    type="button"
                    className="btn-stop"
                    onClick={() => handleStop(index)}
                    disabled={!table.running}
                  >
                    Стоп
                  </button>
                  <button
                    type="button"
                    className="btn-reset"
                    onClick={() => handleReset(index)}
                  >
                    Сбросить
                  </button>
                </div>

                <div className="cost-block cost-block-split">
                  <div className="cost-row">
                    <span className="cost-label">Бильярд</span>
                    <span className="cost-value">{billiardCost} {CURRENCY}</span>
                  </div>
                  <div className="cost-row">
                    <span className="cost-label">Питание и напитки</span>
                    <span className="cost-value">{barTotal} {CURRENCY}</span>
                  </div>
                  <div className="cost-row cost-row-total">
                    <span className="cost-label">Итого</span>
                    <span className="cost-value">{totalSum} {CURRENCY}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-toggle-order"
                  onClick={() => setExpandedTable(isExpanded ? null : index)}
                >
                  {isExpanded ? '▲ Свернуть' : 'Питание и напитки ▼'}
                </button>

                {isExpanded && (
                  <div className="iiko-order-panel">
                    <div className="order-category">
                      <h4>Напитки</h4>
                      <div className="order-buttons">
                        {DRINKS.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            className="order-btn"
                            onClick={() =>
                              addToOrder(index, item, 'Напитки')
                            }
                          >
                            {item.name} — {item.price} {CURRENCY}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="order-category">
                      <h4>Блюда</h4>
                      <div className="order-buttons">
                        {DISHES.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            className="order-btn"
                            onClick={() => addToOrder(index, item, 'Блюда')}
                          >
                            {item.name} — {item.price} {CURRENCY}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="order-table-wrap">
                      <h4>Заказ стола №{index + 1}</h4>
                      {table.order.length === 0 ? (
                        <p className="order-empty">
                          Ничего не добавлено
                        </p>
                      ) : (
                        <table className="order-table">
                          <thead>
                            <tr>
                              <th>Название</th>
                              <th>Цена</th>
                              <th>Кол-во</th>
                              <th>Сумма</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.order.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                <td>{row.name}</td>
                                <td>{row.price} {CURRENCY}</td>
                                <td className="quantity-cell">
                                  <button
                                    type="button"
                                    className="qty-btn"
                                    onClick={() =>
                                      changeQuantity(index, rowIndex, -1)
                                    }
                                    aria-label="Уменьшить"
                                  >
                                    −
                                  </button>
                                  <span>{row.quantity}</span>
                                  <button
                                    type="button"
                                    className="qty-btn"
                                    onClick={() =>
                                      changeQuantity(index, rowIndex, 1)
                                    }
                                    aria-label="Увеличить"
                                  >
                                    +
                                  </button>
                                </td>
                                <td>{row.price * row.quantity} {CURRENCY}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="order-remove"
                                    onClick={() =>
                                      removeFromOrder(index, rowIndex)
                                    }
                                    title="Удалить"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
