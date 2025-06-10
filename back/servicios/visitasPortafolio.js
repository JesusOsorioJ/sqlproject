import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export async function visitasPortafolio(req) {
  try {
    // 1. Obtener IP real tras proxy
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      req.connection.remoteAddress;

    console.log("IP detectada:", ip);

    // 2. Intentar geolocalizar con axios
    let geoData = {};
    try {
      const geoRes = await axios.get(`https://ipapi.co/${ip}/json/`, {
        timeout: 5000,            // timeout a 5s
        validateStatus: null,     // no lanzar en 4xx/5xx
      });

      if (geoRes.status === 200 && geoRes.data && typeof geoRes.data === 'object') {
        geoData = geoRes.data;
      } else {
        console.warn(
          `⚠️ GeoIP warning: status ${geoRes.status}, body:`,
          geoRes.data
        );
      }
    } catch (geoErr) {
      console.error("❌ Error al consultar geolocalización:", geoErr.message);
    }

    // 3. Construir payload, aun si geoData está vacío
    const payload = {
      ip,
      ciudad: geoData.city || "Desconocida",
      latitude: geoData.latitude || "",
      longitud: geoData.longitude || "",
      hora: new Date().toISOString(),
    };
    console.log("Payload a enviar:", payload);

    // 4. Enviar al Web App de Google Apps Script
    const scriptRes = await axios.post(process.env.URL_BASE_SCRIPT_GOOGLE, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
      validateStatus: null,
    });

    // 5. Comprobar respuesta del script
    if (scriptRes.status !== 200) {
      console.error(
        `❌ Google Script responded ${scriptRes.status}:`,
        scriptRes.data
      );
      throw new Error(`Google Script error ${scriptRes.status}`);
    }

    console.log("✅ Registro de visita enviado correctamente.");
    return { status: "ok" };
  } catch (error) {
    console.error("🔴 ERROR en visitasPortafolio:", error.message);
    throw error;
  }
}
