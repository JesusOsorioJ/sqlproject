// src/components/SchemaEditor.tsx
import React, { useState, useEffect, useRef } from "react";
import { useSchema, type SchemaDef, type RowData, type FieldDef } from "../contexts/SchemaContext";
import { examples } from "../utils/data";


const SchemaEditor: React.FC = () => {
  const { fullState, setSchema, clearAll, addRow } = useSchema();
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const typingIntervalRef = useRef<number | null>(null);

  // Función para reproducir efecto typewriter en textarea
  const typeParagraph = (paragraph: string, callback?: () => void) => {
    setText("");
    let i = 0;
    if (typingIntervalRef.current) {
      window.clearInterval(typingIntervalRef.current);
    }
    typingIntervalRef.current = window.setInterval(() => {
      setText((prev) => prev + paragraph[i]);
      i++;
      if (i === paragraph.length) {
        if (typingIntervalRef.current) {
          window.clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        callback && callback();
      }
    }, 50);
  };

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        window.clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Mock para generar esquema vía IA (opcional)
  const mockGenerateSchema = async (description: string): Promise<SchemaDef> => {
    if (description.toLowerCase().includes("e-commerce")) {
      // Ejemplo simple, podrías reemplazarlo por cualquier esquema genérico
      return Promise.resolve({ tables: [], relationships: [] });
    }
    return Promise.reject(new Error("Mock IA: descripción no válida."));
  };

  // Generar esquema vía IA: pregunta confirmación, limpia y crea nuevo esquema con registro de ejemplo
  const handleGenerate = async (overrideText?: string) => {
    const description = overrideText !== undefined ? overrideText : text;
    setError(null);
    if (!description.trim()) {
      setError("Debes escribir una descripción.");
      return;
    }
    if (fullState && fullState.schema.tables.length > 0) {
      const confirmMsg =
        "Al generar un nuevo esquema se eliminará toda la información previa. ¿Deseas continuar?";
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }
    try {
      // Limpia estado previo
      clearAll();
      const newSchema = await mockGenerateSchema(description.trim());
      setSchema(newSchema);
      // Inserta un registro de ejemplo por tabla
      newSchema.tables.forEach((t) => {
        const row: RowData = {};
        t.fields.forEach((f) => {
          if (/INT/i.test(f.type)) row[f.name] = 1;
          else if (/REAL|FLOAT|DOUBLE/i.test(f.type)) row[f.name] = 1.0;
          else if (/CHAR|VARCHAR|TEXT/i.test(f.type)) row[f.name] = "ejemplo";
          else if (/DATE/i.test(f.type)) row[f.name] = new Date().toISOString().split("T")[0];
          else row[f.name] = null;
        });
        addRow(t.name, row);
      });
    } catch (e: any) {
      setError(e.message || "Error generando esquema.");
    }
  };

  // "Probar suerte" sin consultar IA: elige un ejemplo, pregunta confirmación, reproduce tipo en textarea y luego carga esquema y datos
  const handleProbarSuerte = () => {
    if (fullState && fullState.schema.tables.length > 0) {
      const confirmMsg =
        "Al cargar un ejemplo se eliminará toda la información previa. ¿Deseas continuar?";
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }
    const idx = Math.floor(Math.random() * examples.length);
    const chosen = examples[idx];
    // Primero, reproducir párrafo en textarea
    typeParagraph(chosen.paragraph, () => {
      // Al terminar de escribir, limpiar esquema anterior y cargar nuevo
      clearAll();
      setSchema(chosen.schema);
      Object.entries(chosen.data).forEach(([tableName, rows]) => {
        rows.forEach((row) => addRow(tableName, row));
      });
      setError(null);
    });
  };

  return (
    <div className="space-y-2">
      <textarea
        className="w-full h-24 p-2 border rounded focus:outline-none focus:ring"
        placeholder="Describe tu modelo de negocio…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex space-x-2">
        {/* Botón Generar esquema */}
        <button
          className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
          onClick={() => handleGenerate()}
        >
          Generar esquema
        </button>

        {/* Botón Probar suerte */}
        <button
          className="px-4 py-2 rounded text-white bg-yellow-500 hover:bg-yellow-600"
          onClick={handleProbarSuerte}
        >
          Probar suerte
        </button>
      </div>
    </div>
  );
};

export default SchemaEditor;



