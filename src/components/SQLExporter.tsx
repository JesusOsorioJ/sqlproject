// src/components/SQLExporter.tsx
import React from 'react';
import { useDb } from '../contexts/SchemaContext';

const SQLExporter: React.FC = () => {
  const { exportSQL } = useDb();

  const handleDownload = () => {
    const sqlText = exportSQL();
    const blob = new Blob([sqlText], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema_data.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      onClick={handleDownload}
    >
      Descargar SQL Completo
    </button>
  );
};

export default SQLExporter;
