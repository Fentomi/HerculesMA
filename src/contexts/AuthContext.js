import React, { createContext, useState, useContext } from 'react';
import { API_URL } from '../constants/api'; // создадим файл с базовым URL

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // объект из /auth/mobile
  const [clientId, setClientId] = useState(null);

  const signIn = async (userData) => {
    setUser(userData);
    // Если роль клиента, пытаемся получить client_id
    if (userData.role_id === 5) {
      try {
        const res = await fetch(`${API_URL}/clients`);
        const clients = await res.json();
        const client = clients.find(c => c.user_id === userData.user_id);
        if (client) {
          setClientId(client.client_id);
        } else {
          console.warn('Клиент не найден для user_id', userData.user_id);
        }
      } catch (e) {
        console.error('Ошибка получения client_id', e);
      }
    }
  };

  const signOut = () => {
    setUser(null);
    setClientId(null);
  };

  return (
    <AuthContext.Provider value={{ user, clientId, isAuthenticated: !!user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);