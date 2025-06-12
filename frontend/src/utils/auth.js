
import jwtDecode from 'jwt-decode';

export const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error("Erro ao decodificar token:", error);
    return null;
  }
};

export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  return decodeToken(token);
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};