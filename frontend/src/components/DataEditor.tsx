// src/components/DataEditor.tsx
import React, { useState, useEffect } from "react";
import { useSchema, type TableDef, type RowData } from "../contexts/SchemaContext";
import type { FieldDef } from "../contexts/SchemaContext";

interface Props {
  tableName: string;
}

const DataEditor: React.FC<Props> = ({ tableName }) => {
  const { fullState, addRow, updateRow, removeRow } = useSchema();
  if (!fullState) return null;

  const table: TableDef | undefined = fullState.schema.tables.find((t) => t.name === tableName);
  if (!table) {
    return (
      <div>
        <p className="text-red-600">La tabla “{tableName}” no existe.</p>
      </div>
    );
  }

  const [formValues, setFormValues] = useState<RowData>({});
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    setFormValues({});
    setFormErrors(null);
    setEditingIndex(null);
  }, [tableName]);

  const handleChange = (field: FieldDef, value: string) => {
    let parsed: any = value;
    if (/INT/i.test(field.type)) {
      const n = parseInt(value, 10);
      parsed = isNaN(n) ? null : n;
    } else if (/REAL|FLOAT|DOUBLE/i.test(field.type)) {
      const f = parseFloat(value);
      parsed = isNaN(f) ? null : f;
    }
    setFormValues((prev) => ({ ...prev, [field.name]: parsed }));
  };

  const validateRow = (): boolean => {
    for (const field of table.fields) {
      const val = formValues[field.name];
      if (field.required) {
        if (val === undefined || val === null || String(val).trim() === "") {
          setFormErrors(`El campo "${field.name}" es requerido.`);
          return false;
        }
      }
      if (/INT/i.test(field.type)) {
        if (val !== null && val !== undefined && typeof val !== "number") {
          setFormErrors(`El campo "${field.name}" debe ser un entero.`);
          return false;
        }
      }
      if (/REAL|FLOAT|DOUBLE/i.test(field.type)) {
        if (val !== null && val !== undefined && typeof val !== "number") {
          setFormErrors(`El campo "${field.name}" debe ser un número real.`);
          return false;
        }
      }
    }
    setFormErrors(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRow()) return;
    if (editingIndex === null) {
      addRow(tableName, formValues);
    } else {
      updateRow(tableName, editingIndex, formValues);
    }
    setFormValues({});
    setEditingIndex(null);
  };

  const startEditRow = (idx: number) => {
    const existing = fullState.data[tableName][idx];
    setFormValues(existing);
    setEditingIndex(idx);
  };

  const generateRandomValue = (field: FieldDef): any => {
    if (/INT/i.test(field.type)) {
      return Math.floor(Math.random() * 1000);
    }
    if (/REAL|FLOAT|DOUBLE/i.test(field.type)) {
      return parseFloat((Math.random() * 1000).toFixed(2));
    }
    if (/TEXT|CHAR|STRING/i.test(field.type)) {
      const base = field.name.replace(/[^a-zA-Z]/g, "") || "txt";
      return `${base}_${Math.random().toString(36).substring(7)}`;
    }
    if (/DATE/i.test(field.type)) {
      const d = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
      return d.toISOString().split("T")[0];
    }
    return null;
  };

  const generateRandomRow = (): RowData => {
    const newRow: RowData = {};
    for (const field of table.fields) {
      newRow[field.name] = generateRandomValue(field);
    }
    return newRow;
  };

  const handleAddRandomRow = () => {
    const newRow = generateRandomRow();
    console.log({tableName, newRow})
    addRow(tableName, newRow);
  };

  const rows: RowData[] = fullState.data[tableName] || [];

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Datos de “{tableName}”</h3>

      <div className="flex gap-2">
        <button
          onClick={handleAddRandomRow}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Agregar info random
        </button>
      </div>

      {/* Listado de filas */}
      <div className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="italic text-gray-500">No hay registros.</p>
        ) : (
          <table className="min-w-full table-auto border">
            <thead className="bg-gray-900">
              <tr>
                {table.fields.map((f) => (
                  <th key={f.name} className="px-2 py-1 border text-left text-sm font-medium">
                    {f.name}
                  </th>
                ))}
                <th className="px-2 py-1 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="odd:bg-gray-700 even:bg-gray-700">
                  {table.fields.map((f) => (
                    <td key={f.name} className="px-2 py-1 border text-sm">
                      {row[f.name] ?? "NULL"}
                    </td>
                  ))}
                  <td className="px-2 py-1 border text-sm">
                    <button
                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                      onClick={() => startEditRow(idx)}
                    >
                      Editar
                    </button>
                    <button
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => removeRow(tableName, idx)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Formulario de nueva fila o edición */}
      <div className="mt-4">
        <h4 className="font-semibold">
          {editingIndex === null ? "Agregar nueva fila" : `Editar fila #${editingIndex + 1}`}
        </h4>
        <form className="space-y-2 mt-2" onSubmit={handleSubmit}>
          {table.fields.map((f) => (
            <div key={f.name} className="flex flex-col space-y-1">
              <label className="text-sm font-medium">
                {f.name} ({f.type})
                {f.required && <span className="text-red-500"> *</span>}
              </label>
              <input
                type="text"
                className="border px-2 py-1 rounded"
                value={formValues[f.name] !== undefined ? String(formValues[f.name]) : ""}
                onChange={(e) => handleChange(f, e.target.value)}
              />
            </div>
          ))}
          {formErrors && <p className="text-red-600 text-sm">{formErrors}</p>}
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            {editingIndex === null ? "Agregar fila" : "Guardar cambios"}
          </button>
          {editingIndex !== null && (
            <button
              type="button"
              className="ml-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              onClick={() => {
                setEditingIndex(null);
                setFormValues({});
                setFormErrors(null);
              }}
            >
              Cancelar
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default DataEditor;
