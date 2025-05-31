// src/components/QueryToSQL.tsx
import React, { useState } from "react";

/**
 * Componente que envía un texto en lenguaje natural y simula
 * la respuesta de la IA devolviendo un SQL. 
 * En producción, reemplaza el mock por un fetch real a tu backend.
 */
const mockGenerateSQL = async (
  naturalText: string
): Promise<string> => {
  // Ejemplo mínimo: si incluye “productos” y “activo” devolvemos un SELECT.
  if (
    naturalText.toLowerCase().includes("productos") &&
    naturalText.toLowerCase().includes("activo")
  ) {
    const sql = `
SELECT *
FROM Productos
WHERE estado = 'activo';
`.trim();
    return new Promise((resolve) =>
      setTimeout(() => resolve(sql), 400)
    );
  } else if (
    naturalText
      .toLowerCase()
      .includes("usuarios mayores") &&
    naturalText.toLowerCase().includes("edad")
  ) {
    const sql = `
SELECT *
FROM Usuarios
WHERE edad > 18;
`.trim();
    return new Promise((resolve) =>
      setTimeout(() => resolve(sql), 400)
    );
  } else {
    return Promise.reject(
      new Error(
        "Mock IA: no se reconoció la consulta."
      )
    );
  }
};

const QueryToSQL: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [sqlResult, setSqlResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleGenerate = async () => {
    setError(null);
    setSqlResult("");
    if (!text.trim()) {
      setError("Escribe primero tu consulta en lenguaje natural.");
      return;
    }
    try {
      setLoading(true);
      const sql = await mockGenerateSQL(text.trim());
      setSqlResult(sql);
    } catch (e: any) {
      setError(e.message || "Error generando SQL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-2 border rounded bg-white shadow">
      <h3 className="text-lg font-semibold">
        4. Consultas (NL → SQL)
      </h3>
      <textarea
        className="w-full h-24 p-2 border rounded focus:outline-none focus:ring"
        placeholder="Ej. \Dame todos los productos activos\"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
      <button
        className={`px-4 py-2 rounded text-white ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? "Generando..." : "Generar SQL"}
      </button>

      {sqlResult && (
        <div className="mt-4">
          <h4 className="font-medium">SQL generado:</h4>
          <pre className="bg-gray-100 p-2 rounded overflow-auto text-sm">
            {sqlResult}
          </pre>
        </div>
      )}
    </div>
  );
};

export default QueryToSQL;
