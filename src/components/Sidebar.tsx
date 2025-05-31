// src/components/Sidebar.tsx
import React from 'react';

// Definimos las keys válidas para los módulos
export type ModuleKey = 'schema' | 'data-query' | 'overview';

interface SidebarProps {
  selected: ModuleKey;
  onSelect: (module: ModuleKey) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selected, onSelect }) => {
  return (
    <nav className="fixed top-0 left-0 bottom-0 w-64 bg-gray-800 text-white flex flex-col">
      {/* Título */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">SQL Visualizer</h1>
      </div>

      {/* ——— Módulos ——— */}
      <ul className="p-4 space-y-1 flex-1 overflow-y-auto">
        <li>
          <button
            className={`w-full text-left px-3 py-2 rounded-md ${
              selected === 'schema' ? 'bg-gray-700 font-semibold' : 'hover:bg-gray-700'
            }`}
            onClick={() => onSelect('schema')}
          >
            1. Crear & Gestionar Tablas
          </button>
        </li>
        <li>
          <button
            className={`w-full text-left px-3 py-2 rounded-md ${
              selected === 'data-query' ? 'bg-gray-700 font-semibold' : 'hover:bg-gray-700'
            }`}
            onClick={() => onSelect('data-query')}
          >
            2. Registros & Consultas
          </button>
        </li>
        <li>
          <button
            className={`w-full text-left px-3 py-2 rounded-md ${
              selected === 'overview' ? 'bg-gray-700 font-semibold' : 'hover:bg-gray-700'
            }`}
            onClick={() => onSelect('overview')}
          >
            3. Organización & Registros
          </button>
        </li>
      </ul>

      {/* Pie de barra lateral */}
      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">v1.0.0</p>
      </div>
    </nav>
  );
};

export default Sidebar;
