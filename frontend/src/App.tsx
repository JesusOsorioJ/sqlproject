// src/App.tsx
import React, { useState } from 'react';
import { SchemaProvider, useSchema } from './contexts/SchemaContext';

import Sidebar, { type ModuleKey } from './components/Sidebar';
import SchemaEditor from './components/SchemaEditor';
import AddTableForm from './components/AddTableForm';
import Diagram from './components/Diagram';
import TablePropertiesEditor from './components/TablePropertiesEditor';
import DataEditor from './components/DataEditor';
import QueryToSQL from './components/QueryToSQL';
import Overview from './components/Overview';

const App: React.FC = () => {
  // 1) Índice del módulo activo
  const [selectedModule, setSelectedModule] = useState<ModuleKey>('schema');
  // 2) Tabla actualmente seleccionada para “schema” y para “data-query”
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SchemaProvider>
      <div className="flex h-screen overflow-hidden w-screen text-gray-900">
        {/* Sidebar */}
        <Sidebar
          selected={selectedModule}
          onSelect={setSelectedModule}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        {/* Contenido principal */}
        <main className={`flex-1 ml-64 duration-500 ${isCollapsed ? "ml-[80px]" : " ml-[300px]"} overflow-auto bg-gray-50 p-6`}>

          {/* ——— Módulo 1: Crear & Gestionar Tablas ——— */}
          {selectedModule === 'schema' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">1. Crear & Gestionar Tablas</h2>

              {/* 1a) Editor de Esquema (texto + IA + tabla manual) */}
              <div className="bg-white p-4 rounded shadow space-y-4">
                <SchemaEditor />
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">Agregar tabla manualmente</h3>
                  <AddTableForm />
                </div>
              </div>

              {/* 1b) Diagrama + Propiedades */}
              {selectedTable ? (
                /* ——— Caso: Hay tabla seleccionada ——— */
                <div className="flex gap-6">
                  {/* Diagrama ocupa la mitad (flex-1) */}
                  <div className="flex-1 bg-white rounded-lg shadow p-4">
                    <Diagram onTableSelect={setSelectedTable} />
                  </div>
                  {/* Panel de propiedades ocupa la otra mitad */}
                  <div className="flex-1">
                    <div className="bg-white p-4 rounded shadow">
                      <div className="flex justify-between">
                        <h3 className="text-xl font-semibold mb-2">
                          Propiedades de “{selectedTable}”
                        </h3>
                        <button
                          className="px-4 py-2 rounded text-white cursor-not-allowed"
                          onClick={() => setSelectedTable("")}
                        >
                          Cerrar
                        </button>
                      </div>
                      <TablePropertiesEditor tableName={selectedTable} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-white rounded-lg shadow p-4">
                  <Diagram onTableSelect={setSelectedTable} />
                </div>
              )}
            </div>
          )}

          {/* ——— Módulo 2: Registros & Consultas ——— */}
          {selectedModule === 'data-query' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">2. Registros & Consultas</h2>

              {/* Selector de tabla compartido */}
              <div className="bg-white p-4 rounded shadow">
                <label className="block text-sm font-medium mb-1">Seleccionar tabla</label>
                <TableDropdown
                  selectedTable={selectedTable}
                  onChange={setSelectedTable}
                />
              </div>

              {/* Panel dividido: DataEditor (registros) a la izquierda y QueryToSQL (consultas) a la derecha */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 2.1 DataEditor */}
                <div className="bg-white p-4 rounded shadow">
                  <h3 className="text-xl font-semibold mb-2">Registros de “{selectedTable || '...'}”</h3>
                  {selectedTable ? (
                    <DataEditor tableName={selectedTable} />
                  ) : (
                    <p className="italic text-gray-500">
                      Selecciona una tabla arriba para ver/editar registros.
                    </p>
                  )}
                </div>

                {/* 2.2 QueryToSQL (pasa selectedTable como prop para ocultar su selector interno) */}
                <div className="bg-white p-4 rounded shadow">
                  <h3 className="text-xl font-semibold mb-2">Consultas sobre “{selectedTable || '...'}”</h3>
                  {selectedTable ? (
                    <QueryToSQL tableName={selectedTable} />
                  ) : (
                    <p className="italic text-gray-500">
                      Selecciona una tabla arriba para habilitar consultas.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ——— Módulo 3: Organización & Registros ——— */}
          {selectedModule === 'overview' && (
            <div className="space-y-6">
              <Overview />
            </div>
          )}
        </main>
      </div>
    </SchemaProvider>
  );
};

export default App;

/**
 * Componente auxiliar para mostrar un <select> con todas las tablas disponibles.
 */
interface TableDropdownProps {
  selectedTable: string;
  onChange: (newTable: string) => void;
}

const TableDropdown: React.FC<TableDropdownProps> = ({ selectedTable, onChange }) => {
  const { fullState } = useSchema();
  const tableOptions = fullState?.schema.tables.map((t) => t.name) || [];

  return (
    <select
      className="w-full border px-2 py-1 rounded"
      value={selectedTable}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">-- Elige una tabla --</option>
      {tableOptions.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
};
