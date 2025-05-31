// src/components/Overview.tsx
import React from 'react';
import { useSchema } from '../contexts/SchemaContext';

const Overview: React.FC = () => {
  const { fullState, clearAll } = useSchema();

  if (!fullState) {
    return <p>Cargando...</p>;
  }

  const { schema, data } = fullState;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">3. Organización & Registros</h2>

      {/* Esquema (tablas y campos) */}
      <div className="bg-white p-4 rounded shadow space-y-4">
        <h3 className="text-lg font-semibold">Esquema actual</h3>
        {schema.tables.length === 0 ? (
          <p className="italic text-gray-500">No hay tablas definidas.</p>
        ) : (
          <div className="space-y-3">
            {schema.tables.map((t) => (
              <div key={t.name} className="border-b pb-2">
                <h4 className="font-medium">{t.name}</h4>
                {t.fields.length === 0 ? (
                  <p className="text-sm text-gray-500 ml-2">(Sin campos)</p>
                ) : (
                  <ul className="ml-4 list-disc text-sm">
                    {t.fields.map((f) => (
                      <li key={f.name}>
                        {f.name} ({f.type})
                        {f.required && <span className="text-red-500"> *</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Relaciones */}
      <div className="bg-white p-4 rounded shadow space-y-2">
        <h3 className="text-lg font-semibold">Relaciones definidas</h3>
        {schema.relationships.length === 0 ? (
          <p className="italic text-gray-500">No hay relaciones definidas.</p>
        ) : (
          <ul className="list-disc ml-4 text-sm">
            {schema.relationships.map((rel, idx) => (
              <li key={idx}>
                {rel.sourceTable}.{rel.sourceField} &rarr;{' '}
                {rel.targetTable}.{rel.targetField} <strong>({rel.cardinality})</strong>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Datos (registros) */}
      <div className="bg-white p-4 rounded shadow space-y-4">
        <h3 className="text-lg font-semibold">Registros almacenados</h3>
        {Object.keys(data).length === 0 ? (
          <p className="italic text-gray-500">No hay datos almacenados.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(data).map(([tableName, rows]) => (
              <div key={tableName} className="border-b pb-2">
                <h4 className="font-medium">{tableName}</h4>
                {rows.length === 0 ? (
                  <p className="text-sm text-gray-500 ml-2">(Sin registros)</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border">
                      <thead className="bg-gray-100">
                        <tr>
                          {schema.tables
                            .find((t) => t.name === tableName)!
                            .fields.map((f) => (
                              <th
                                key={f.name}
                                className="px-2 py-1 border text-left text-sm font-medium"
                              >
                                {f.name}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => (
                          <tr
                            key={idx}
                            className="odd:bg-white even:bg-gray-50"
                          >
                            {schema
                              .tables.find((t) => t.name === tableName)!
                              .fields.map((f) => (
                                <td
                                  key={f.name}
                                  className="px-2 py-1 border text-sm"
                                >
                                  {row[f.name] ?? 'NULL'}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón “Eliminar toda la información” */}
      <div className="pt-4 border-t border-gray-200">
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={() => {
            if (
              window.confirm(
                '¿Estás seguro de que quieres eliminar TODO el esquema y los datos? Esta acción es irreversible.'
              )
            ) {
              clearAll();
            }
          }}
        >
          Eliminar toda la información
        </button>
      </div>
    </div>
  );
};

export default Overview;
