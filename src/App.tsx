// src/App.tsx
import React, { useState } from 'react';
import { SchemaProvider } from './contexts/SchemaContext';

import Sidebar from './components/Sidebar';
import type { ModuleKey } from './components/Sidebar';
import SchemaEditor from './components/SchemaEditor';
import AddTableForm from './components/AddTableForm';
import Diagram from './components/Diagram';
import TablePropertiesEditor from './components/TablePropertiesEditor';
import DataEditor from './components/DataEditor';
import QueryToSQL from './components/QueryToSQL';
import ExportJSON from './components/ExportJSON';
import { useSchema } from './contexts/SchemaContext';

const App: React.FC = () => {
  // Estado para la sección seleccionada en el sidebar
  const [selectedModule, setSelectedModule] = useState<ModuleKey>('create-schema');
  // Estado para saber qué tabla está seleccionada (para las secciones "manage-tables" y "edit-data")
  const [selectedTable, setSelectedTable] = useState<string>('');

  return (
    <SchemaProvider>
      <div className="flex h-screen overflow-hidden w-screen">
        {/* Barra lateral izquierda */}
        <Sidebar selected={selectedModule} onSelect={setSelectedModule} />

        {/* Contenido principal a la derecha */}
        <main className="flex-1 ml-60 overflow-auto bg-gray-50 p-6 text-gray-900 ">
          {/* 1) Crear Esquema */}
          {selectedModule === 'create-schema' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">1. Crear Esquema</h2>
              <div className="bg-white p-4 rounded shadow space-y-4">
                <SchemaEditor />
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">Agregar tabla manualmente</h3>
                  <AddTableForm />
                </div>
              </div>
            </div>
          )}

          {/* 2) Gestionar Tablas */}
          {selectedModule === 'manage-tables' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">2. Gestionar Tablas</h2>
              <div className="flex gap-6">
                <div className="flex-1 bg-white rounded-lg shadow p-4">
                  <Diagram onTableSelect={setSelectedTable} />
                </div>
                <div className="flex-1 space-y-4">
                  {selectedTable ? (
                    <div className="bg-white p-4 rounded shadow">
                      <h3 className="text-xl font-semibold mb-2">Propiedades de “{selectedTable}”</h3>
                      <TablePropertiesEditor tableName={selectedTable} />
                    </div>
                  ) : (
                    <div className="italic text-gray-500">Haz clic en una tabla del diagrama para ver sus propiedades.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3) Modificar Datos */}
          {selectedModule === 'edit-data' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">3. Modificar Datos</h2>
              {selectedTable ? (
                <div className="bg-white p-4 rounded shadow">
                  <h3 className="text-xl font-semibold mb-2">Datos de “{selectedTable}”</h3>
                  <DataEditor tableName={selectedTable} />
                </div>
              ) : (
                <div className="italic text-gray-500">
                  Selecciona una tabla en la sección “Gestionar Tablas” para editar sus datos.
                </div>
              )}
            </div>
          )}

          {/* 4) Consultas */}
          {selectedModule === 'queries' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">4. Consultas (NL → SQL)</h2>
              <div className="bg-white p-4 rounded shadow">
                <QueryToSQL />
              </div>
            </div>
          )}

          {/* 5) Exportar JSON */}
          {selectedModule === 'export-json' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">5. Exportar Esquema + Datos</h2>
              <div className="bg-white p-4 rounded shadow">
                <ExportJSON />
              </div>
            </div>
          )}
        </main>
      </div>
    </SchemaProvider>
  );
};

export default App;
