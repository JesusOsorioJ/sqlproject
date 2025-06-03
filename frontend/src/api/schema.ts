import axios from 'axios';

// -------- CONFIGURACIÓN --------
// Cambia esto si el backend está en otro host/puerto:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Credenciales fijas para /login (tal y como lo definiste en tu backend)
const CREDENTIALS = {
  username: 'username',
  password: 'password'
};

// Llave de localStorage donde guardaremos el JWT
const TOKEN_KEY = 'mi_app_token';

// Tiempo (ms) cada cuánto refrescar el token (60 segundos = 60000 ms)
const REFRESH_INTERVAL = 60 * 1000;

// --------------------------------

// Instancia de Axios para llamadas al backend
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Función auxiliar: guardamos el token en localStorage
function saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

// Función auxiliar: recuperamos el token desde localStorage
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Función auxiliar: eliminamos el token
function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// 1) Función de login: llama a POST /login y guarda el token en localStorage
export async function login() {
  try {
    const resp = await axios.post(`${API_BASE_URL}/login`, CREDENTIALS);
    const { token } = resp.data;
    saveToken(token);
    console.log('[API] Nuevo token guardado.');
    return token;
  } catch (err) {
    if (err instanceof Error) {
      // Axios errors may have a 'response' property
      const axiosErr = err as any;
      console.error('[API] Error en login:', axiosErr.response?.data || err.message);
    } else {
      console.error('[API] Error en login:', err);
    }
    throw err;
  }
}

// 2) Middleware para adjuntar el token a cada petición
apiClient.interceptors.request.use(
  (config) => {
    const tk = getToken();
    if (tk) {
      config.headers['Authorization'] = `Bearer ${tk}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3) Interceptor de respuesta: si obtenemos 401, hacemos login y reintentamos la petición
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Si el error es 401 y aún no lo hemos reintentado en esta petición:
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Borramos token viejo (por si acaso) y pedimos uno nuevo
        removeToken();
        const nuevoToken = await login();
        // Adjuntamos el nuevo token en la cabecera y reintentamos
        originalRequest.headers['Authorization'] = `Bearer ${nuevoToken}`;
        return apiClient(originalRequest);
      } catch (loginError) {
        // Si falla el login, devolvemos el error original
        return Promise.reject(loginError);
      }
    }
    // Cualquier otro error o si ya se reintentó, lo propagamos:
    return Promise.reject(error);
  }
);

// 4) Función para llamar a POST /query
interface ConsultaIARequest {
    prompt: string;
}

interface ConsultaIAResponse {
    respuesta: string;
}

export async function consultaIA(promptText: string): Promise<string> {
    if (typeof promptText !== 'string' || promptText.trim() === '') {
        throw new Error('El prompt debe ser un string no vacío.');
    }

    try {
        const resp = await apiClient.post<ConsultaIAResponse, { data: ConsultaIAResponse }, ConsultaIARequest>(
            '/query',
            { prompt: promptText }
        );
        // Asumimos que el backend responde { respuesta: '...' }
        return resp.data.respuesta;
    } catch (err: any) {
        console.error('[API] Error en consultaIA:', err.response?.data || err.message);
        // Propagamos el error para manejarlo en la UI
        throw err;
    }
}

// 5) Función que arranca el “refresco automático” del token cada minuto
export function arrancarAutoRefreshToken() {
  // Lanza un login inmediatamente para tener un token inicial:
  login().catch((err) => {
    console.warn('[API] No se pudo obtener token inicial:', err.message);
  });

  // Cada REFRESH_INTERVAL ms, llama a login() para renovar:
  setInterval(() => {
    console.log('[API] Refrescando token automáticamente...');
    login().catch((err) => {
      console.warn('[API] Error renovando token:', err.message);
    });
  }, REFRESH_INTERVAL);
}