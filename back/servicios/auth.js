// auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION;

if (!JWT_SECRET) {
  console.error('🔴 ERROR: Falta definir JWT_SECRET en .env');
  process.exit(1);
}
if (!JWT_EXPIRATION) {
  console.error('🔴 ERROR: Falta definir JWT_EXPIRATION en .env');
  process.exit(1);
}

/**
 * Genera un JWT con un payload mínimo.  
 * Aquí podrías incluir más datos en el payload (p.ej. userId, rol, etc.).
 */
export function generarToken(payload = {}) {
  // Sign con la clave secreta y duración que viene de .env
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION
  });
  return token;
}

/**
 * Middleware de Express para validar el token JWT en cada petición.  
 * Se asume que el cliente envía el token en el header Authorization: Bearer <token>.
 */
export function verificarToken(req, res, next) {
  // Leer el header "Authorization"
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Falta el token de autorización.' });
  }

  // Debe venir como "Bearer <token>"
  const partes = authHeader.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de token inválido.' });
  }

  const token = partes[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Puedes inyectar el payload en req.user para usarlo luego si quieres
    req.user = payload;
    next();
  } catch (err) {
    console.error('🔴 ERROR verificación de token:', err);
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}
