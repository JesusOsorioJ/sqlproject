// src/components/SchemaEditor.tsx
import React, { useState } from "react";
import { useSchema } from "../contexts/SchemaContext";
import type { SchemaDef, TableDef, FieldDef, Relationship } from "../contexts/SchemaContext";

/**
 * Este componente simula la llamada a IA. 
 * En producción reemplaza `mockGenerateSchema` por fetch('/api/schema').
 */
const mockGenerateSchema = async (
  description: string
): Promise<SchemaDef> => {
  // Ejemplo muy simple: si el texto contiene "e-commerce", devolvemos tres tablas.
  if (description.toLowerCase().includes("e-commerce")) {
    const schema: SchemaDef = {
      tables: [
        {
          name: "Productos",
          fields: [
            { name: "id", type: "INT", required: true },
            { name: "nombre", type: "VARCHAR(100)", required: true },
            { name: "precio", type: "REAL", required: true },
            { name: "estado", type: "VARCHAR(20)", required: true },
          ],
        },
        {
          name: "Usuarios",
          fields: [
            { name: "id", type: "INT", required: true },
            { name: "email", type: "VARCHAR(100)", required: true },
            { name: "nombre", type: "VARCHAR(50)", required: true },
          ],
        },
        {
          name: "Ventas",
          fields: [
            { name: "id", type: "INT", required: true },
            {
              name: "usuario_id",
              type: "INT",
              required: true,
            },
            {
              name: "producto_id",
              type: "INT",
              required: true,
            },
            { name: "fecha", type: "DATE", required: true },
            { name: "cantidad", type: "INT", required: true },
          ],
        },
      ],
      relationships: [
        {
          sourceTable: "Ventas",
          sourceField: "usuario_id",
          targetTable: "Usuarios",
          targetField: "id",
        },
        {
          sourceTable: "Ventas",
          sourceField: "producto_id",
          targetTable: "Productos",
          targetField: "id",
        },
      ],
    };
    // Simular retardo:
    return new Promise((resolve) =>
      setTimeout(() => resolve(schema), 500)
    );
  } else {
    return Promise.reject(
      new Error("Mock IA: no se reconoció la descripción.")
    );
  }
};

const SchemaEditor: React.FC = () => {
  const { setSchema, loading } = useSchema();
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    if (!text.trim()) {
      setError("Debe escribir una descripción.");
      return;
    }
    try {
      const newSchema: SchemaDef = await mockGenerateSchema(
        text.trim()
      );
      setSchema(newSchema);
    } catch (e: any) {
      setError(e.message || "Error generando esquema.");
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        className="w-full h-24 p-2 border rounded focus:outline-none focus:ring"
        placeholder="Describe tu modelo de negocio…"
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
            : "bg-blue-600 hover:bg-blue-700"
        }`}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? "Cargando..." : "Generar esquema"}
      </button>
    </div>
  );
};

export default SchemaEditor;
