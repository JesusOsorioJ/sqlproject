// src/components/ExportJSON.tsx
import React from "react";
import { useSchema } from "../contexts/SchemaContext";

const ExportJSON: React.FC = () => {
  const { fullState } = useSchema();

  const handleDownload = () => {
    if (!fullState) return;
    const jsonStr = JSON.stringify(fullState, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema_data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      onClick={handleDownload}
    >
      Descargar JSON (Esquema + Datos)
    </button>
  );
};

export default ExportJSON;
