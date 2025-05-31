// src/components/QueryToSQL.tsx
import React, { useState, useEffect } from "react";
import { useSchema } from "../contexts/SchemaContext";

interface QueryToSQLProps {
  // Si se le pasa tableName, QueryToSQL no muestra selector interno
  tableName?: string;
}

const mockGenerateSQL = async (
  tableName: string,
  naturalText: string
): Promise<string> => {
  // Mock muy simplificado: si la tabla es "Productos" y el texto incluye "activo",
  // devuelve un WHERE; en otro caso, un SELECT * básico.
  if (
    tableName.toLowerCase() === "productos" &&
    naturalText.toLowerCase().includes("activo")
  ) {
    const sql = `
SELECT *
FROM ${tableName}
WHERE estado = 'activo';
    `.trim();
    return new Promise((resolve) => setTimeout(() => resolve(sql), 400));
  }
  return new Promise((resolve) =>
    setTimeout(() => resolve(`SELECT *\nFROM ${tableName};`), 400)
  );
};

const QueryToSQL: React.FC<QueryToSQLProps> = ({ tableName: propTable }) => {
  const { fullState } = useSchema();

  // Si se recibe propTable, lo usamos directamente; si no, usamos estado local.
  const [selectedTable, setSelectedTable] = useState<string>(propTable || "");
  const [text, setText] = useState<string>("");
  const [sqlResult, setSqlResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Lista de tablas para el selector interno (solo si propTable === undefined)
  const tableOptions = fullState?.schema.tables.map((t) => t.name) || [];

  // Si tenemos propTable, sincronizamos selectedTable con él
  useEffect(() => {
    if (propTable) {
      setSelectedTable(propTable);
    }
  }, [propTable]);

  // Si no se ha seleccionado nada y existen tablas en el estado, preseleccionamos la primera
  useEffect(() => {
    if (!propTable && tableOptions.length > 0 && !selectedTable) {
      setSelectedTable(tableOptions[0]);
    }
  }, [tableOptions, propTable, selectedTable]);

  const handleGenerate = async () => {
    setError(null);
    setSqlResult("");
    if (!selectedTable) {
      setError("Debes seleccionar primero la tabla.");
      return;
    }
    if (!text.trim()) {
      setError("Escribe primero tu consulta en lenguaje natural.");
      return;
    }
    try {
      setLoading(true);
      const sql = await mockGenerateSQL(selectedTable, text.trim());
      setSqlResult(sql);
    } catch (e: any) {
      setError(e.message || "Error generando SQL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Si NO venimos con propTable, mostramos selector interno */}
      {!propTable && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Tabla a consultar</label>
          <select
            className="w-full border px-2 py-1 rounded"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
          >
            <option value="">-- Selecciona tabla --</option>
            {tableOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Área de texto para la consulta natural */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Consulta en lenguaje natural
        </label>
        <textarea
          className="w-full h-24 p-2 border rounded focus:outline-none focus:ring"
          placeholder='Ej. "Mostrar todos los registros activos"'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        className={`px-4 py-2 rounded text-white ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
        }`}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? "Generando..." : "Generar SQL"}
      </button>

      {sqlResult && (
        <div className="mt-4">
          <h4 className="font-medium">SQL generado:</h4>
          <pre className="bg-gray-100 p-2 rounded overflow-auto text-sm">{sqlResult}</pre>
        </div>
      )}
    </div>
  );
};

export default QueryToSQL;
