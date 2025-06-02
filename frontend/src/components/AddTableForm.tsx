// src/components/AddTableForm.tsx
import React, { useState } from "react";
import { useSchema } from "../contexts/SchemaContext";

const AddTableForm: React.FC = () => {
  const { fullState, addTable } = useSchema();
  const [newTableName, setNewTableName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    setError(null);
    const nameTrim = newTableName.trim();
    if (!nameTrim) {
      setError("El nombre de la tabla no puede estar vacío.");
      return;
    }
    // Si ya existe una tabla con ese nombre, mostramos error
    const exists = fullState?.schema.tables.find(
      (t) => t.name === nameTrim
    );
    if (exists) {
      setError(`Ya existe una tabla llamada "${nameTrim}".`);
      return;
    }
    addTable(nameTrim);
    setNewTableName("");
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        className="border px-2 py-1 rounded flex-1"
        placeholder="Nuevo nombre de tabla"
        value={newTableName}
        onChange={(e) => setNewTableName(e.target.value)}
      />
      <button
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={handleAdd}
      >
        + Tabla
      </button>
      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default AddTableForm;
