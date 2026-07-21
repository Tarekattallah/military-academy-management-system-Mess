import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // send/receive the httpOnly auth cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
