import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CURRENCY = 'ТГ';

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

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [order, setOrder] = useState([]);

  const addToOrder = (item, category) => {
    setOrder((prev) => {
      const found = prev.find((x) => x.name === item.name && x.category === category);
      if (found) {
        return prev.map((x) =>
          x === found ? { ...x, quantity: x.quantity + 1 } : x
        );
      }
      return [...prev, { ...item, category, quantity: 1 }];
    });
  };

  const removeFromOrder = (index) => {
    setOrder((prev) => prev.filter((_, i) => i !== index));
  };

  const changeQuantity = (index, delta) => {
    setOrder((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const q = row.quantity + delta;
        if (q < 1) return null;
        return { ...row, quantity: q };
      }).filter(Boolean)
    );
  };

  const total = order.reduce((sum, row) => sum + row.price * row.quantity, 0);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Личный кабинет</h1>
        <div className="header-actions">
          <Link to="/iiko" className="btn-link">
            iiko · Бильярд
          </Link>
          <button type="button" className="btn-logout" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>
      <div className="dashboard-content">
        <p className="dashboard-user">
          Вы вошли как <strong>{user?.email}</strong>
          {user?.name && <> ({user.name})</>}.
        </p>

        <section className="order-section">
          <h2>Добавить в заказ</h2>

          <div className="order-categories">
            <div className="order-category">
              <h3>Напитки</h3>
              <div className="order-buttons">
                {DRINKS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className="order-btn"
                    onClick={() => addToOrder(item, 'Напитки')}
                  >
                    {item.name} — {item.price} {CURRENCY}
                  </button>
                ))}
              </div>
            </div>
            <div className="order-category">
              <h3>Блюда</h3>
              <div className="order-buttons">
                {DISHES.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className="order-btn"
                    onClick={() => addToOrder(item, 'Блюда')}
                  >
                    {item.name} — {item.price} {CURRENCY}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="order-table-wrap">
            <h3>Ваш заказ</h3>
            {order.length === 0 ? (
              <p className="order-empty">Пока ничего не добавлено. Нажмите кнопки выше.</p>
            ) : (
              <table className="order-table">
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Название</th>
                    <th>Категория</th>
                    <th>Цена</th>
                    <th>Кол-во</th>
                    <th>Сумма</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {order.map((row, index) => (
                    <tr key={`${row.name}-${row.category}-${index}`}>
                      <td>{index + 1}</td>
                      <td>{row.name}</td>
                      <td>{row.category}</td>
                      <td>{row.price} {CURRENCY}</td>
                      <td className="quantity-cell">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => changeQuantity(index, -1)}
                          aria-label="Уменьшить"
                        >
                          −
                        </button>
                        <span>{row.quantity}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => changeQuantity(index, 1)}
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
                          onClick={() => removeFromOrder(index)}
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
            {order.length > 0 && (
              <p className="order-total">
                Итого: <strong>{total} {CURRENCY}</strong>
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
