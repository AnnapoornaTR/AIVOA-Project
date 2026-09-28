import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 45000,
});

export const deviationService = {
  // Analyze uploaded document or pasted text
  analyzeDeviation: async (fileOrText) => {
    if (fileOrText instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrText);
      const res = await api.post('/deviations/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } else {
      const formData = new FormData();
      formData.append('text', fileOrText);
      const res = await api.post('/deviations/analyze', formData);
      return res.data;
    }
  },

  // Save reviewed deviation
  saveDeviation: async (deviationData) => {
    const res = await api.post('/deviations', deviationData);
    return res.data;
  },

  // List all deviations
  getDeviations: async () => {
    const res = await api.get('/deviations');
    return res.data;
  },

  // Get deviation by ID
  getDeviationById: async (id) => {
    const res = await api.get(`/deviations/${id}`);
    return res.data;
  },

  // Ask AI about deviation
  askAI: async (payload) => {
    const res = await api.post('/deviations/chat', payload);
    return res.data;
  },
};

export default api;
