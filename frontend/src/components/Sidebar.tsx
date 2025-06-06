import React, { useState } from 'react';

export type ModuleKey = 'schema' | 'data-query' | 'overview';

interface SidebarProps {
  selected: ModuleKey;
  onSelect: (module: ModuleKey) => void;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selected, onSelect, isCollapsed, setIsCollapsed }) => {
  const [isCollapsedText, setIsCollapsedText] = useState(false);

  const toggleCollapse = () => {
    let duration = 0
    if (isCollapsed == true) duration = 300
    setIsCollapsed(!isCollapsedText)
    setTimeout(() => { setIsCollapsedText((prev) => !prev) }, duration)
  };

  return (
    <nav
      className={`fixed top-0 left-0 bottom-0 bg-gray-950 text-white flex flex-col overflow-hidden transition-all 
        duration-500 ease-in-out ${isCollapsed ? "w-[80px]" : "w-[300px]"}`}
      style={{ zIndex: 50 }}
    >
      {/* Header con botón para colapsar/expandir */}
      <div className="px-2 py-4 flex justify-center items-center border-b border-gray-700 w-full">
        {!isCollapsed && <h1 className="pr-20 text-4xl font-bold">SQL</h1>}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded bg-gray-900 hover:bg-gray-700 text-white"
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? (
            <span>{`>>`}</span>
          ) : (
            <span>{`<<`}</span>
          )}
        </button>
      </div>

      {/* Menú de navegación */}
      <ul className="flex-1 px-2 py-4 space-y-1 text-center">
        <li>
          <button
            className={`w-full text-left px-3 py-2 rounded-md flex items-center ${selected === 'schema' ? 'bg-gray-700' : 'bg-gray-900 hover:bg-gray-700'
              }`}
            onClick={() => onSelect('schema')}
          >
            <span>{!isCollapsedText ? "1. Crear & Gestionar Tablas" : "1."}</span>
          </button>
        </li>
        <li>
          <button
            className={`w-full text-left px-3 py-2 rounded-md flex items-center ${selected === 'data-query' ? 'bg-gray-700' : 'bg-gray-900 hover:bg-gray-700'
              }`}
            onClick={() => onSelect('data-query')}
          >
            <span>{!isCollapsedText ? "2. Registros & Consultas" : "2."}</span>
          </button>
        </li>
        <li>
          <button
            className={`w-full text-left px-3 py-2 rounded-md flex items-center  ${selected === 'overview' ? 'bg-gray-700' : 'bg-gray-900 hover:bg-gray-700'
              }`}
            onClick={() => onSelect('overview')}
          >
            <span>{!isCollapsedText ? "3. Organización & Registros" : "3."}</span>
          </button>
        </li>
      </ul>

      {/* Pie de página */}
      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">v1.0.0</p>
      </div>
    </nav>
  );
};

export default Sidebar;
