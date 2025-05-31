// src/components/TableList.tsx
import React from 'react';
import { useDb, type TableDef } from '../contexts/SchemaContext';

interface Props {
  tableName: string;
  setTableName: (t: string) => void;
}

const TableList: React.FC<Props> = ({ tableName, setTableName }) => {
  const { schema } = useDb();
  if (!schema || schema.tables.length === 0) {
    return <p className="italic text-gray-500">Primero genera el esquema.</p>;
  }

  return (
    <div>
      <label className="block font-medium mb-1">Selecciona tabla:</label>
      <select
        className="border px-2 py-1 rounded"
        value={tableName}
        onChange={e => setTableName(e.target.value)}
      >
        {schema.tables.map((t: TableDef) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TableList;
