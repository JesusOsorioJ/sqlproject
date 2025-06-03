// src/components/QueryToSQL.tsx
import React, { useState, useEffect } from "react";
import { useSchema, type SchemaDef, type RowData } from "../contexts/SchemaContext";
import { consultaIA } from "../api/schema";
import alasql from "alasql";
import { buildSQLPrompt, isValidSQL } from "../utils/data";

interface QueryToSQLProps {
  tableName?: string;
}

const QueryToSQL: React.FC<QueryToSQLProps> = ({ tableName: propTable }) => {
  const { fullState, clearAll } = useSchema();

  const [selectedTable, setSelectedTable] = useState<string>(propTable || "");
  const [text, setText] = useState<string>("");              
  const [generatedSQL, setGeneratedSQL] = useState<string>("");
  const [editableSQL, setEditableSQL] = useState<string>("");   
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const tableOptions = fullState?.schema.tables.map((t) => t.name) || [];

  useEffect(() => {
    if (propTable) {
      setSelectedTable(propTable);
    }
  }, [propTable]);

  useEffect(() => {
    if (!propTable && tableOptions.length > 0 && !selectedTable) {
      setSelectedTable(tableOptions[0]);
    }
  }, [tableOptions, propTable, selectedTable]);

  

  /**
   * Registra todas las tablas y datos en AlaSQL para poder consultarlas luego.
   * Antes de crear cada tabla, hace DROP TABLE IF EXISTS para evitar errores.
   */
  function registerTablesInAlaSQL(
    schema: SchemaDef,
    data: { [tabla: string]: RowData[] }
  ) {
    schema.tables.forEach((t) => {
      const nombreTabla = t.name;
      const filas = data[nombreTabla] || [];

      // 1) Si existe, la eliminamos
      alasql(`DROP TABLE IF EXISTS ${nombreTabla}`);

      // 2) Construir DDL dinámico (mapeo simple de tipos)
      const camposDDL = t.fields
        .map((f) => {
          let tipoAla: string;
          if (/INT/i.test(f.type)) tipoAla = "INT";
          else if (/REAL|FLOAT|DOUBLE/i.test(f.type)) tipoAla = "FLOAT";
          else if (/DATE/i.test(f.type)) tipoAla = "STRING";
          else tipoAla = "STRING"; // VARCHAR, CHAR, TEXT, etc.
          return `${f.name} ${tipoAla}`;
        })
        .join(", ");

      const ddl = `CREATE TABLE ${nombreTabla} (${camposDDL});`;
      alasql(ddl);

      // 3) Insertar filas (si existen)
      if (filas.length > 0) {
        alasql(`SELECT * INTO ${nombreTabla} FROM ?`, [filas]);
      }
    });
  }

  /**
   * Genera la SQL llamando a la IA (BACK) hasta 5 intentos de validación.
   * Si es válida, la guarda en generatedSQL y en editableSQL para que el usuario la edite.
   */
  const handleGenerate = async () => {
    setError(null);
    setGeneratedSQL("");
    setEditableSQL("");
    setQueryResult(null);

    if (!selectedTable) {
      setError("Debes seleccionar primero la tabla.");
      return;
    }
    if (!text.trim()) {
      setError("Escribe primero tu consulta en lenguaje natural.");
      return;
    }
    if (!fullState) {
      setError("El esquema de la base de datos no está disponible.");
      return;
    }

    setLoading(true);

    let intentos = 0;
    let sqlValido: string | null = null;
    let ultimoError: string | null = null;

    const prompt = buildSQLPrompt(fullState.schema, selectedTable, text.trim());

    while (intentos < 5 && !sqlValido) {
      intentos++;
      try {
        const respuesta = await consultaIA(prompt);
        if (isValidSQL(respuesta, selectedTable)) {
          sqlValido = respuesta.trim();
          break;
        } else {
          ultimoError = `Intento ${intentos}: SQL inválido → "${respuesta}"`;
          console.warn(ultimoError);
          continue;
        }
      } catch (err: any) {
        ultimoError = `Intento ${intentos}: Error llamando a la IA: ${err.message || err}`;
        console.error(ultimoError);
      }
    }

    if (sqlValido) {
      setGeneratedSQL(sqlValido);
      setEditableSQL(sqlValido);
    } else {
      setError("Error: no fue posible generar una consulta SQL válida tras 5 intentos.");
      console.error("Último error de validación:", ultimoError);
    }

    setLoading(false);
  };

  /**
   * Toma el SQL (posiblemente modificado por el usuario) y lo ejecuta en memoria usando AlaSQL.
   * Primero registra las tablas, luego corre la consulta y guarda los resultados en queryResult.
   */
  const handleExecute = () => {
    setError(null);
    setQueryResult(null);

    if (!editableSQL.trim()) {
      setError("No hay una consulta SQL para ejecutar.");
      return;
    }
    if (!fullState) {
      setError("El esquema de la base de datos no está disponible.");
      return;
    }

    try {
      const tableData = (fullState as any).data; // adapta si tu propiedad se llama diferente
      registerTablesInAlaSQL(fullState.schema, tableData);

      const resultado: any[] = alasql(editableSQL);
      setQueryResult(resultado);
    } catch (e: any) {
      console.error("Error ejecutando SQL en memoria:", e);
      setError("Error ejecutando la consulta sobre los datos en memoria.");
    }
  };

  return (
    <div className="space-y-4">
      {!propTable && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Tabla a consultar</label>
          <select
            className="w-full border px-2 py-1 rounded"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            disabled={loading}
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

      {/* Área de texto para la consulta en lenguaje natural */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Consulta en lenguaje natural
        </label>
        <textarea
          className="w-full h-24 p-2 border rounded focus:outline-none focus:ring"
          placeholder='Ej. "Mostrar todos los usuarios con salario mayor a 5"'
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Botón: Generar SQL */}
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

      {loading && (
        <p className="text-gray-600 text-sm italic">Pensando… por favor espera.</p>
      )}

      {/* Si hay SQL generado, lo mostramos en un textarea editable */}
      {generatedSQL && (
        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium">SQL generado (puedes editarlo)</label>
          <textarea
            className="w-full h-32 p-2 border rounded focus:outline-none focus:ring font-mono text-sm"
            value={editableSQL}
            onChange={(e) => setEditableSQL(e.target.value)}
            disabled={false}
          />
        </div>
      )}

      {/* Botón: Ejecutar SQL en memoria */}
      {generatedSQL && (
        <button
          className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
          onClick={handleExecute}
          disabled={loading}
        >
          Ejecutar SQL
        </button>
      )}

      {/* Mostrar resultado de la consulta sobre los datos en memoria */}
      {queryResult && (
        <div className="mt-4">
          <h4 className="font-medium">Resultado sobre datos locales:</h4>
          <pre className="bg-gray-50 p-2 rounded overflow-auto text-sm">
            {JSON.stringify(queryResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default QueryToSQL;
