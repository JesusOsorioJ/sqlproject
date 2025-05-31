// src/components/TableDataEditor.tsx
import React, { useContext, useState } from 'react';
import { useDb, type ColumnDef } from '../contexts/SchemaContext';

interface Props {
  tableName: string;
  className?: string;
}

const TableDataEditor: React.FC<Props> = ({ tableName, className }) => {
  const { schema, insertRow } = useDb();
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);

  if (!schema) {
    return <div className={className}>Genera primero el esquema.</div>;
  }

  const table = schema.tables.find(t => t.name === tableName);
  if (!table) {
    return <div className={className}>Tabla “{tableName}” no existe.</div>;
  }

  // 4.4.1. Handler para cambiar valores en el formulario dinámico
  const handleChange = (col: ColumnDef, value: string) => {
    let parsed: any = value;
    // Intentamos convertir a número si el tipo es INT o REAL
    if (/INT/i.test(col.type)) {
      const n = parseInt(value, 10);
      parsed = isNaN(n) ? null : n;
    } else if (/REAL|FLOAT|DOUBLE/i.test(col.type)) {
      const f = parseFloat(value);
      parsed = isNaN(f) ? null : f;
    }
    setFormValues(prev => ({
      ...prev,
      [col.name]: parsed,
    }));
  };

  // 4.4.2. Handler para enviar el INSERT
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validar que se llenaron las columnas NOT NULL (omito validación exhaustiva)
    const rowObj: Record<string, any> = {};
    table.columns.forEach(col => {
      // Si es PRIMARY y no envió nada, dejamos NULL y que SQLite lo declíne
      rowObj[col.name] = formValues[col.name] ?? null;
    });
    try {
      insertRow(tableName, rowObj);
      setMessage('Fila insertada correctamente.');
      // Limpiar form
      setFormValues({});
    } catch (err: any) {
      setMessage('Error insertando fila: ' + err.message || err);
    }
  };

  return (
    <div className={className}>
      <h3 className="font-semibold mb-2">Insertar datos en “{tableName}”</h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        {table.columns.map((col: ColumnDef) => (
          <div key={col.name} className="flex flex-col">
            <label className="text-sm font-medium mb-1">{col.name} ({col.type})</label>
            <input
              type="text"
              className="border px-2 py-1 rounded"
              value={formValues[col.name] ?? ''}
              onChange={e => handleChange(col, e.target.value)}
            />
          </div>
        ))}
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Agregar fila
        </button>
      </form>
      {message && (
        <p className={`mt-2 ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default TableDataEditor;
