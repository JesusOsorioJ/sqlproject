// src/components/TableNode.tsx
import React from "react";
import { Handle, Position } from "react-flow-renderer";
import type { NodeProps } from "react-flow-renderer";
import type { FieldDef } from "../contexts/SchemaContext";

interface TableNodeData {
  tableName: string;
  fields: FieldDef[];
  onOpenEditor: (tableName: string) => void;
  isExpanded: boolean;
  toggleExpand: (tableName: string) => void;
  // Nueva prop: cerrar el panel de propiedades
  closeEditor: () => void;
}

const TableNode: React.FC< NodeProps<TableNodeData> > = ({ data }) => {
  const {
    tableName,
    fields,
    onOpenEditor,
    isExpanded,
    toggleExpand,
    closeEditor,
  } = data;

  // Handler del botón “Ver detalles” / “Cerrar”
  const handleToggle = () => {
    if (isExpanded) {
      // Si ya está expandido y clicamos “Cerrar”, entonces también cerramos el editor
      closeEditor();
    }
    toggleExpand(tableName);
  };

  return (
    <div
      className="border rounded-lg bg-white shadow-sm font-sans text-sm"
    //   style={{ width: isExpanded ? 200 : 120 }}
    >
      {/* Handle superior (target) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#555" }}
      />

      {/* Contenido principal del nodo */}
      <div className="p-2">
        <div className="flex gap-1 flexjustify-between items-center mb-1">
          <div className="font-medium">{tableName}</div>
          <button
            onClick={handleToggle}
            className="text-xs text-white hover:underline"
            style={{ lineHeight: 1 }}
          >
            {isExpanded ? "Cerrar" : "Detalles"}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-1">
            <div className="max-h-28 overflow-y-auto">
              {fields.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  (Sin campos)
                </p>
              ) : (
                fields.map((f) => (
                  <div
                    key={f.name}
                    className="flex justify-between items-center text-xs"
                  >
                    <span>
                      {f.name}{" "}
                      <span className="text-gray-500">
                        ({f.type}
                        {f.required ? ", req." : ""})
                      </span>
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onOpenEditor(tableName)}
              className="mt-2 w-full px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              Editar
            </button>
          </div>
        )}
      </div>

      {/* Handle inferior (source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#555" }}
      />
    </div>
  );
};

export default TableNode;
