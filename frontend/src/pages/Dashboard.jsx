import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Личный кабинет</h1>
        <button type="button" className="btn-logout" onClick={logout}>
          Выйти
        </button>
      </header>
      <div className="dashboard-content">
        <p>
          Вы вошли как <strong>{user?.email}</strong>
          {user?.name && <> ({user.name})</>}.
        </p>
      </div>
    </div>
  );
}
