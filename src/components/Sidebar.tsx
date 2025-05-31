// src/components/Sidebar.tsx
import React from 'react';

export type ModuleKey = 'create-schema' | 'manage-tables' | 'edit-data' | 'queries' | 'export-json';

interface SidebarProps {
  selected: ModuleKey;
  onSelect: (module: ModuleKey) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selected, onSelect }) => {
  const menuItems: { key: ModuleKey; label: string }[] = [
    { key: 'create-schema', label: '1. Crear Esquema' },
    { key: 'manage-tables', label: '2. Gestionar Tablas' },
    { key: 'edit-data', label: '3. Modificar Datos' },
    { key: 'queries', label: '4. Consultas' },
    { key: 'export-json', label: '5. Exportar JSON' },
  ];

  return (
    <nav className="fixed top-0 left-0 bottom-0 w-60 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">SQL Visualizer</h1>
      </div>
      <ul className="flex-1 overflow-y-auto space-y-1 p-2">
        {menuItems.map(({ key, label }) => (
          <li key={key}>
            <button
              className={`w-full text-left px-4 py-2 rounded-md ${
                selected === key
                  ? 'bg-gray-700 font-semibold'
                  : 'hover:bg-gray-700'
              }`}
              onClick={() => onSelect(key)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
      <div className="p-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">v1.0.0</p>
      </div>
    </nav>
  );
};

export default Sidebar;
