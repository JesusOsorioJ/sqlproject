// src/App.tsx
import React, { useState } from "react";
import { SchemaProvider } from "./contexts/SchemaContext";

import SchemaEditor from "./components/SchemaEditor";
import Diagram from "./components/Diagram";
import TablePropertiesEditor from "./components/TablePropertiesEditor";
import DataEditor from "./components/DataEditor";
import QueryToSQL from "./components/QueryToSQL";
import ExportJSON from "./components/ExportJSON";

const App: React.FC = () => {
  // Controla qué tabla está seleccionada para editar
  const [selectedTable, setSelectedTable] = useState<string>("");

  return (
    <SchemaProvider>
      <div className="min-h-screen bg-gray-50 p-6 space-y-8 text-gray-950 w-screen">
        {/* 1) Editor de esquema (IA → JSON) */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-2xl font-bold mb-2">
            1. Crear Esquema
          </h2>
          <SchemaEditor />
        </div>

        {/* 2) Diagrama de tablas y relaciones */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-2xl font-bold mb-2">
            2. Diagrama de Esquema
          </h2>
          <Diagram onTableSelect={setSelectedTable} />
        </div>

        {/* 3) Panel de edición de la tabla seleccionada */}
        {selectedTable && (
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-2xl font-bold mb-2">
              3. Propiedades de “{selectedTable}”
            </h2>
            <TablePropertiesEditor tableName={selectedTable} />
          </div>
        )}

        {/* 4) Inserción de datos en la tabla seleccionada */}
        {selectedTable && (
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-2xl font-bold mb-2">
              4. Datos de “{selectedTable}”
            </h2>
            <DataEditor tableName={selectedTable} />
          </div>
        )}

        {/* 5) Consultas NL → SQL */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-2xl font-bold mb-2">
            5. Consulta (NL → SQL)
          </h2>
          <QueryToSQL />
        </div>

        {/* 6) Exportar JSON */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-2xl font-bold mb-2">
            6. Exportar Esquema + Datos
          </h2>
          <ExportJSON />
        </div>
      </div>
    </SchemaProvider>
  );
};

export default App;
