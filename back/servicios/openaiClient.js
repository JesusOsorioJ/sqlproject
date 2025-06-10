// openaiClient.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const authApi = axios.create({
  baseURL: process.env.URL_BASE,
  headers: {
    Authorization: `Bearer ${process.env.TOKEN}`
  },
});

/**
 * Llama al endpoint /chat_completion de tu servicio externo
 * enviando un único mensaje con role="user" y content=prompt.
 * @param {string} prompt - El texto que envía el frontend para obtener SQL o JSON.
 * @returns {Promise<string>} - La cadena que devuelva el servicio de IA.
 */
export async function consultaIA(prompt) {
  try {
    // Montamos el body exactamente como espera la API remota:
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    // Realizamos la petición POST a /chat_completion
    const response = await authApi.post('/chat_completion', body);
    const choices = response.data.choices;
    if (
      choices &&
      Array.isArray(choices) &&
      choices.length > 0 &&
      choices[0].message &&
      typeof choices[0].message.content === 'string'
    ) {
      return choices[0].message.content.trim();
    }

    // Si no viene en ese formato, devolvemos el data completo como string:
    return JSON.stringify(response.data);
  } catch (error) {
    console.error('🔴 ERROR en consultaIA:', error.response?.data || error.message);
    throw error;
  }
}
