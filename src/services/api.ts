const TOKEN_KEY = 'nova_bank_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const method = (options.method || 'GET').toUpperCase();
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const response = await fetch(endpoint, {
        ...options,
        headers,
        signal: options.signal || controller.signal
      });

      clearTimeout(timeoutId);

      // Retry on 502, 503, 504 gateway errors
      if ([502, 503, 504].includes(response.status) && attempt < retries) {
        attempt++;
        await new Promise(r => setTimeout(r, 500 * attempt));
        continue;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred while communicating with the bank server');
      }

      return data as T;
    } catch (err: any) {
      const isNetworkError =
        err.name === 'AbortError' ||
        err.name === 'TypeError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError');

      // Auto retry GET or transient network failures
      if (isNetworkError && attempt < retries && (method === 'GET' || attempt === 0)) {
        attempt++;
        await new Promise(r => setTimeout(r, 600 * attempt));
        continue;
      }

      if (err.name === 'AbortError') {
        throw new Error('Server request timed out due to network slowness. Please try again.');
      }
      throw err;
    }
  }

  throw new Error('Connection issue. Please check your internet connection.');
}
