import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pint-backend-vwqc.onrender.com/api';
const REQUEST_TIMEOUT_MS = 5000;

const buildUrl = (path) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const http = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
});

http.interceptors.request.use((config) => {
  const loginDataRaw = sessionStorage.getItem('loginData') || localStorage.getItem('loginData');
  if (loginDataRaw) {
    try {
      const loginData = JSON.parse(loginDataRaw);
      if (loginData && loginData.token) {
        config.headers.Authorization = `Bearer ${loginData.token}`;
      }
    } catch {
      // Ignore parse errors
    }
  }
  return config;
});

const request = async (path, options = {}) => {
  try {
    const response = await http({
      url: buildUrl(path),
      ...options,
    });

    return {
      data: typeof response.data === 'undefined' ? null : response.data,
      status: response.status,
    };
  } catch (error) {
    const statusCode = error?.response?.status;

    if (statusCode === 401) {
      sessionStorage.removeItem('loginData');
      localStorage.removeItem('loginData');
      window.location.href = '/entrar';
      return;
    }

    const message = error?.response?.data?.message || error?.message || 'HTTP request failed';
    const requestError = new Error(message);
    const errorDetails = error?.response?.data?.details;
    const errorCode = error?.response?.data?.code;

    // Attach full server response data for debugging
    if (error?.response?.data) {
      requestError.response = error.response;
    }

    if (errorDetails) {
      requestError.details = errorDetails;
    }

    if (errorCode) {
      requestError.code = errorCode;
    }

    if (statusCode) {
      requestError.status = statusCode;
    }

    throw requestError;
  }
};

const isFormDataPayload = (payload) => (
  typeof FormData !== 'undefined' && payload instanceof FormData
);

const buildJsonHeaders = (customHeaders = {}) => ({
  'Content-Type': 'application/json',
  ...customHeaders,
});

const apiClient = {
  get(path, options = {}) {
    return request(path, { method: 'GET', ...options });
  },

  post(path, body, options = {}) {
    const payload = body ?? {};
    const headers = isFormDataPayload(payload)
      ? (options.headers || {})
      : buildJsonHeaders(options.headers);

    return request(path, {
      method: 'POST',
      data: payload,
      ...options,
      headers,
    });
  },

  put(path, body, options = {}) {
    const payload = body ?? {};
    const headers = isFormDataPayload(payload)
      ? (options.headers || {})
      : buildJsonHeaders(options.headers);

    return request(path, {
      method: 'PUT',
      data: payload,
      ...options,
      headers,
    });
  },

  patch(path, body, options = {}) {
    const payload = body ?? {};
    const headers = isFormDataPayload(payload)
      ? (options.headers || {})
      : buildJsonHeaders(options.headers);

    return request(path, {
      method: 'PATCH',
      data: payload,
      ...options,
      headers,
    });
  },

  delete(path, options = {}) {
    return request(path, { method: 'DELETE', ...options });
  },
};

export default apiClient;
