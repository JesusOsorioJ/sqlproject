import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const api = axios.create({
    baseURL: process.env.URL_BASE_SCRIPT_GOOGLE,
});

export async function visitasPortafolio(req) {
    try {
        const ip =
            req.headers["x-forwarded-for"]?.split(",")[0] || req.connection.remoteAddress;

        // Consultar geolocalización
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
        const geoData = await geoRes.json();

        const payload = {
            ip,
            ciudad: geoData.city,
            latitude: geoData.latitude,
            longitud: geoData.longitude,
            hora: new Date().toISOString(),
        };

        await api.post('/', payload);
        return { status: "ok" }
    } catch (error) {
        console.error('🔴 ERROR en visitasPortafolio:', error.response?.data || error.message);
        throw error;
    }
}
