// src/App.tsx
import React, { useState } from "react";
import { SchemaProvider } from "./contexts/SchemaContext";

import SchemaEditor from "./components/SchemaEditor";
import AddTableForm from "./components/AddTableForm";
import Diagram from "./components/Diagram";
import TablePropertiesEditor from "./components/TablePropertiesEditor";
import DataEditor from "./components/DataEditor";
import QueryToSQL from "./components/QueryToSQL";
import ExportJSON from "./components/ExportJSON";

const App: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>("");

  return (
    <SchemaProvider>
      <div className="min-h-screen bg-gray-50 p-6 space-y-8 w-screen text-gray-900">
        {/* 1) Editor de esquema y botón para agregar tablas */}
        <div className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-2xl font-bold">1. Crear Esquema</h2>
          <SchemaEditor />
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2">
              Agregar tabla manualmente
            </h3>
            <AddTableForm />
          </div>
        </div>

        {/* 2) Diagrama de tablas y relaciones (pasa setSelectedTable) */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-2xl font-bold">2. Diagrama de Esquema</h2>
          <Diagram onTableSelect={setSelectedTable} />
        </div>

        {/* 3) Editor de propiedades de la tabla seleccionada */}
        {selectedTable && (
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-2xl font-bold">
              3. Propiedades de “{selectedTable}”
            </h2>
            <TablePropertiesEditor tableName={selectedTable} />
          </div>
        )}

        {/* 4) Editor de datos de la tabla seleccionada */}
        {selectedTable && (
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-2xl font-bold">
              4. Datos de “{selectedTable}”
            </h2>
            <DataEditor tableName={selectedTable} />
          </div>
        )}

        {/* 5) Consultas NL → SQL */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-2xl font-bold">5. Consulta (NL → SQL)</h2>
          <QueryToSQL />
        </div>

        {/* 6) Exportar JSON */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-2xl font-bold">6. Exportar Esquema + Datos</h2>
          <ExportJSON />
        </div>
      </div>
    </SchemaProvider>
  );
};

export default App;
