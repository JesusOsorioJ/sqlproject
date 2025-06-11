// src/components/SchemaEditor.tsx
import React, { useState, useEffect, useRef } from "react";
import { useSchema, type SchemaDef, type RowData } from "../contexts/SchemaContext";
import { buildSchemaWithDataPrompt, examples, isValidData, isValidSchema } from "../utils/data";
import { consultaIA } from "../api/schema";

const SchemaEditor: React.FC = () => {
  const { fullState, setSchema, clearAll, addRow, setUserText } = useSchema();
  const [error, setError] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<{ [tabla: string]: RowData[] }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    setUserText("");
    let texInput = "";
    let i = 0;
    if (typingIntervalRef.current) {
      window.clearInterval(typingIntervalRef.current);
    }
    typingIntervalRef.current = window.setInterval(() => {
      texInput += paragraph[i];
      setUserText(texInput);
      i++;
      if (i === paragraph.length) {
        if (typingIntervalRef.current) {
          window.clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        if (callback) {callback();}
      }
    }, 10);
  };

  function isValidFullResponse(obj: { schema: SchemaDef; data: { [tabla: string]: any[] } }) {
    if (!isValidSchema(obj)) {
      return false;
    }
    return isValidData(obj, obj.schema);
  }

  const handleGenerate = async (overrideText?: string) => {
    const description = overrideText !== undefined
        ? overrideText
        : fullState?.userText?.trim() ?? "";

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

    clearAll();
    setIsLoading(true);

    let intentos = 0;
    let fullResponse: { schema: SchemaDef; data: { [tabla: string]: any[] } } | null = null;
    let ultimoError: string | null = null;

    const promptFormato = buildSchemaWithDataPrompt(description.trim());

    while (intentos < 5 && fullResponse === null) {
      intentos++;
      try {
        const respuestaTexto = await consultaIA(promptFormato);

        let posibleObj: any;
        try {
          posibleObj = JSON.parse(respuestaTexto);
        } catch (parseErr) {
          ultimoError = `Intento ${intentos}: JSON inválido (error de parse).`;
          console.warn(ultimoError);
          continue;
        }

        if (isValidFullResponse(posibleObj)) {
          fullResponse = posibleObj;
          break;
        } else {
          ultimoError = `Intento ${intentos}: La estructura no coincide con el formato requerido.`;
          console.warn(ultimoError);
          continue;
        }
      } catch (err: any) {
        ultimoError = `Intento ${intentos}: Error llamando a la IA: ${err.message || err}`;
        console.error(ultimoError);
      }
    }

    if (fullResponse) {
      setSchema(fullResponse.schema);
      setPendingData(fullResponse.data);
      setError(null);
    } else {
      setError(
        "Error: no fue posible generar el esquema en el formato requerido tras 5 intentos."
      );
      console.error("Último error de validación:", ultimoError);
    }

    setIsLoading(false);
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
      setUserText(chosen.paragraph); 
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
        value={fullState?.userText ?? ""}
        onChange={(e) => setUserText(e.target.value)}
        disabled={isLoading}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Indicador de loading */}
      {isLoading && (
        <p className="text-gray-600 text-sm italic">Pensando… por favor, espera.</p>
      )}

      <div className="flex space-x-2">
        <button
          className={`px-4 py-2 rounded text-white ${
            isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
          onClick={() => handleGenerate()}
          disabled={isLoading}
        >
          {isLoading ? "Pensando…" : "Generar esquema"}
        </button>
        <button
          className={`px-4 py-2 rounded text-white ${
            isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-cyan-700 hover:bg-cyan-600"
          }`}
          onClick={handleProbarSuerte}
          disabled={isLoading}
        >
          {isLoading ? "Cargando" : "Probar suerte"}
        </button>
      </div>
    </div>
  );
};

export default SchemaEditor;
