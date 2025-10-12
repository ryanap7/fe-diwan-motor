// Utility functions for managing authentication cookies

export const setCookie = (name, value, days = 7) => {
  if (typeof document !== 'undefined') {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  }
};

export const getCookie = (name) => {
  if (typeof document !== 'undefined') {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
};

export const deleteCookie = (name) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict`;
  }
};

export const setAuthToken = (accessToken, refreshToken = null) => {
  localStorage.setItem('token', accessToken);
  setCookie('authToken', accessToken);
  
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
    setCookie('refreshToken', refreshToken, 30); // refresh token 30 days
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  deleteCookie('authToken');
  deleteCookie('refreshToken');
};