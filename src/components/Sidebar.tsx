import React, { useState } from 'react';

export type ModuleKey = 'schema' | 'data-query' | 'overview';

interface SidebarProps {
  selected: ModuleKey;
  onSelect: (module: ModuleKey) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selected, onSelect }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  return (
    <nav
      className={`fixed top-0 left-0 bottom-0 bg-gray-800 text-white flex flex-col overflow-hidden transition-all duration-300 ease-in-out w-fit`}
      style={{ zIndex: 50 }}
    >
      {/* Header con botón para colapsar/expandir */}
      <div className="p-4 flex justify-between items-center border-b border-gray-700 w-full">
        {!isCollapsed && <h1 className="text-xl font-bold">SQL Visualizer</h1>}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? (
            <span className="material-icons">{`>>`}</span>
          ) : (
            <span className="material-icons">{`<<`}</span>
          )}
        </button>
      </div>

      {/* Menú de navegación */}
      <ul className="flex-1 px-2 py-4 space-y-1 text-center">
        <li>
          <button
            className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${
              selected === 'schema' ? 'bg-gray-700 font-semibold' : 'hover:bg-gray-700'
            }`}
            onClick={() => onSelect('schema')}
          >
            <span>{!isCollapsed ? "1. Crear & Gestionar Tablas" : "1"}</span>
          </button>
        </li>
        <li>
          <button
            className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${
              selected === 'data-query' ? 'bg-gray-700 font-semibold' : 'hover:bg-gray-700'
            }`}
            onClick={() => onSelect('data-query')}
          >
            <span className="material-icons text-sm">2</span>
            {!isCollapsed && <span>2. Registros & Consultas</span>}
          </button>
        </li>
        <li>
          <button
            className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${
              selected === 'overview' ? 'bg-gray-700 font-semibold' : 'hover:bg-gray-700'
            }`}
            onClick={() => onSelect('overview')}
          >
            <span className="material-icons text-sm">3</span>
            {!isCollapsed && <span>3. Organización & Registros</span>}
          </button>
        </li>
      </ul>

      {/* Pie de página */}
      <div className="px-4 py-4 border-t border-gray-700">
        {!isCollapsed && <p className="text-sm text-gray-400">v1.0.0</p>}
      </div>
    </nav>
  );
};

export default Sidebar;
