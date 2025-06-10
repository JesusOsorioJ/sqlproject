// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { consultaIA } from './servicios/openaiClient.js';
import { generarToken, verificarToken } from './servicios/auth.js';
import { visitasPortafolio } from './servicios/visitasPortafolio.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ✅ Confía en encabezados de proxy (Render)
app.set('trust proxy', true);

// Middlewares globales
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => {
  res.json({ mensaje: 'Backend de IA activo (sin token requerido aquí).' });
});

app.post('/login', (req, res) => {
  const { username = "", password = "" } = req.body || {};
  // Validación muy simplificada (solo ejemplo)
  if (username === 'username' && password === 'password') {
    // Generamos un payload mínimo; podrías incluir más datos (rol, id, etc.)
    const payload = { user: username };
    const token = generarToken({payload});
    return res.json({ token });
  } else {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }
});


app.post('/query', verificarToken, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Falta el campo "prompt" en el body.' });
    }

    // Llamamos a la IA usando nuestro cliente Axios
    const respuestaIA = await consultaIA(prompt);
    return res.json({ respuesta: respuestaIA });
  } catch (err) {
    console.error('🔴 ERROR en /api/query:', err);
    return res.status(500).json({ error: 'Error interno al consultar la IA.' });
  }
});

app.post('/visitasPortafolio', async (req, res) => {
  try {
    await visitasPortafolio(req);
    return
  } catch (err) {
    return res.status(500).json({ error: '🔴 ERROR en /visitasPortafolio' });
  }
});

// ------------------------------------------------------------------
// 4) Iniciar servidor
// ------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ Servidor de IA escuchando en http://localhost:${PORT}`);
});
