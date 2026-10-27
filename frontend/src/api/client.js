import axios from 'axios';

/**
 * Axios API Client for ResolveIQ
 *
 * Why withCredentials?
 * Our backend stores JWT tokens in httpOnly cookies (for maximum security).
 * withCredentials: true ensures the browser sends these cookies automatically.
 */
const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Response Interceptor:
 * If an API request fails with 401 (access token expired),
 * this interceptor automatically calls /auth/refresh to get a new token
 * and retries the original request seamlessly without bothering the user.
 */
api.interceptors.response.use(
  (response) => response, // If request succeeded, return response as-is
  async (error) => {
    const originalRequest = error.config;

    // Do not retry auth endpoints (login, register, refresh) to avoid loops
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (isAuthEndpoint || !originalRequest) {
      return Promise.reject(error);
    }

    // Check if error is 401 (Unauthorized) and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Step 1: Request new access token using refresh cookie
        await api.post('/auth/refresh');

        // Step 2: Retry the user's original request that failed
        return api(originalRequest);
      } catch (refreshError) {
        // Step 3: If refresh also failed (e.g. 30 days inactive), log user out
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
