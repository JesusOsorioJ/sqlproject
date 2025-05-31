// src/components/QueryEditor.tsx
import React, { useState } from 'react';
import { useDb } from '../contexts/SchemaContext';

const QueryEditor: React.FC = () => {
  const { runQuery } = useDb();
  const [sql, setSql] = useState<string>('');
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResults(null);
    if (!sql.trim()) {
      setError('La consulta no puede estar vacía.');
      return;
    }
    try {
      const res = runQuery(sql);
      setResults(res);
    } catch (e: any) {
      setError('Error ejecutando consulta: ' + e.message);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded bg-white shadow">
      <h3 className="font-semibold">Query SQL</h3>
      <form onSubmit={handleExecute}>
        <textarea
          className="w-full h-24 p-2 border rounded"
          placeholder="Escribe tu consulta SQL…"
          value={sql}
          onChange={e => setSql(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Ejecutar
        </button>
      </form>

      <div>
        {results && results.length === 0 && (
          <p className="italic text-gray-500">La consulta no devolvió filas.</p>
        )}

        {results && results.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto mt-2 border">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(results[0]).map(colName => (
                    <th
                      key={colName}
                      className="px-2 py-1 border text-left text-sm font-medium"
                    >
                      {colName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, idx) => (
                  <tr key={idx} className="odd:bg-white even:bg-gray-50">
                    {Object.values(row).map((val, i) => (
                      <td key={i} className="px-2 py-1 border text-sm">
                        {val === null ? 'NULL' : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryEditor;
