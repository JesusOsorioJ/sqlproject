// src/components/SchemaEditor.tsx
import React, { useState, useEffect, useRef } from "react";
import { useSchema, type SchemaDef, type RowData } from "../contexts/SchemaContext";
import { examples } from "../utils/data";

const SchemaEditor: React.FC = () => {
  const { fullState, setSchema, clearAll, addRow } = useSchema();
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<{ [tabla: string]: RowData[] }>({});

  const typingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        window.clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!fullState) return; 
    const esquemaTablas = fullState.schema.tables.map((t) => t.name);
    const tablasAAInsertar: string[] = [];
    const nuevoPending = { ...pendingData };

    Object.entries(pendingData).forEach(([tableName, rows]) => {
      if (esquemaTablas.includes(tableName)) {
        rows.forEach((fila) => {
          addRow(tableName, fila);
        });
        tablasAAInsertar.push(tableName);
      }
    });

    if (tablasAAInsertar.length > 0) {
      tablasAAInsertar.forEach((tabla) => {
        delete nuevoPending[tabla];
      });
      setPendingData(nuevoPending);
    }
  }, [fullState?.schema, pendingData, addRow]);

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
        if (callback) callback();
      }
    }, 10);
  };

  const mockGenerateSchema = async (description: string): Promise<SchemaDef> => {
    if (description.toLowerCase().includes("e-commerce")) {
      return Promise.resolve({ tables: [], relationships: [] });
    }
    return Promise.reject(new Error("Mock IA: descripción no válida."));
  };

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
      clearAll();
      const newSchema = await mockGenerateSchema(description.trim());
      const ejemploData: { [tabla: string]: RowData[] } = {};
      newSchema.tables.forEach((t) => {
        const filaEjemplo: RowData = {};
        t.fields.forEach((f) => {
          if (/INT/i.test(f.type)) filaEjemplo[f.name] = 1;
          else if (/REAL|FLOAT|DOUBLE/i.test(f.type)) filaEjemplo[f.name] = 1.0;
          else if (/CHAR|VARCHAR|TEXT/i.test(f.type)) filaEjemplo[f.name] = "ejemplo";
          else if (/DATE/i.test(f.type)) {
            filaEjemplo[f.name] = new Date().toISOString().split("T")[0];
          } else {
            filaEjemplo[f.name] = null;
          }
        });
        ejemploData[t.name] = [filaEjemplo];
      });

      setSchema(newSchema);
      setPendingData(ejemploData);
    } catch (e: any) {
      setError(e.message || "Error generando esquema.");
    }
  };

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

    typeParagraph(chosen.paragraph, () => {
      clearAll();
      setSchema(chosen.schema);
      setPendingData(chosen.data);

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
        <button
          className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
          onClick={() => handleGenerate()}
        >
          Generar esquema
        </button>
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
