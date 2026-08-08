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

      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (_) {
          const text = await response.text().catch(() => '');
          data = { error: text || `Invalid server response (${response.status})` };
        }
      } else {
        const text = await response.text().catch(() => '');
        try {
          data = JSON.parse(text);
        } catch (_) {
          data = { error: text || `Server error (${response.status})` };
        }
      }

      if (!response.ok) {
        const errorMsg = data.error || data.message || `An error occurred while communicating with the bank server (${response.status})`;
        const error = new Error(errorMsg) as Error & { status?: number };
        error.status = response.status;
        throw error;
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
