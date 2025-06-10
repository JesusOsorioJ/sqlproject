import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const api = axios.create({
    baseURL: process.env.URL_BASE_SCRIPT_GOOGLE,
});

export async function visitasPortafolio(req) {
    try {
        const ip = req.clientIp || req.headers['x-forwarded-for'] || req.ip;
        console.log({ip});
        // Obtener ciudad usando API externa (opcional)
        const ipInfo = await axios.get(`https://ipapi.co/${ip}/json/`);
        const ciudad = ipInfo.data.city || "Desconocida";
        const hora = new Date().toISOString();

        const body = {
            ip,
            latitude,
            longitud,
            ciudad,
            hora
        };
        await api.post('/', body);
        return 'Añadido correctamente'
    } catch (error) {
        console.error('🔴 ERROR en visitasPortafolio:', error.response?.data || error.message);
        throw error;
    }
}
