// src/lib/api.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore'; // Adjust path as needed

// --- YOUR INTERFACES ---
// (These are good, keep them)
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  ordering?: string;
}
// ... (your other interfaces) ...
export interface StatusFilterParams {
  status?: string | string[];
}
// --- END OF YOUR INTERFACES ---



// --- START OF THE SOLUTION ---
// Add all this code below your interfaces

const api = axios.create({
  // SET YOUR DJANGO BACKEND'S BASE URL HERE

  baseURL: 'http://localhost:8000/api/v1', // Or from your .env file
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR
 * This function runs *before* every API request is sent.
 * It automatically gets the token from your auth store and adds it to the header.
 */
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * RESPONSE INTERCEPTOR
 * This function runs *after* every API response is received.
 * It checks for 401 Unauthorized errors and logs the user out.
 */
api.interceptors.response.use(
  (response) => {
    // If request was successful (2xx), just return the response
    return response;
  },
  (error) => {
    // Check if the error is a 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      // This is what's causing your "automatic logout"
      // We log out the user and clean the store.
      useAuthStore.getState().clearAuth();
      
      // Optional: force a page reload to the login screen
      // window.location.href = '/login';
    }
    
    // Return the error so your component's .catch() block still works
    return Promise.reject(error);
  }
);

// Export the 'api' instance as the default export
export default api;