import axios from 'axios';

// No GitHub Pages, o backend precisa estar hospedado em outro lugar
// Por enquanto, usa localhost para desenvolvimento
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

export default api;
