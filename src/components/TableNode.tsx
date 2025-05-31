// src/components/TableNode.tsx
import React from "react";
import { Handle, Position, type NodeProps } from "react-flow-renderer";
import type { FieldDef } from "../contexts/SchemaContext";

interface TableNodeData {
  tableName: string;
  fields: FieldDef[];
  onOpenEditor: (tableName: string) => void;
  isExpanded: boolean;
  toggleExpand: (tableName: string) => void;
  closeEditor: () => void;
}

const TableNode: React.FC<NodeProps<TableNodeData>> = ({ data }) => {
  const {
    tableName,
    fields,
    onOpenEditor,
    isExpanded,
    toggleExpand,
    closeEditor,
  } = data;

  // Altura base del nodo (título + paddings)
  const baseHeight = 30;
  // Altura de cada campo en modo expandido
  const fieldHeight = 20;
  // Calculamos la altura total
  const nodeHeight = isExpanded
    ? baseHeight + fields.length * fieldHeight
    : baseHeight;

  // Handler para “Ver detalles” / “Cerrar”
  const handleToggle = () => {
    if (isExpanded) {
      closeEditor(); // cierra el panel de propiedades
    }
    toggleExpand(tableName);
  };

  return (
    <div
      className="border rounded-lg bg-white shadow-sm font-sans text-sm relative"
      style={{
        width: isExpanded ? 200 : 120,
        height: nodeHeight,
      }}
    >
      {/* Si está expandido, renderizamos un Handle target y source por cada campo */}
      {isExpanded &&
        fields.map((f, idx) => {
          // Calculamos desplazamiento vertical para cada campo
          const topPosition = baseHeight + idx * fieldHeight + 4;
          return (
            <React.Fragment key={f.name}>
              <Handle
                type="target"
                position={Position.Left}
                id={`target__${tableName}__${f.name}`}
                style={{
                  top: topPosition,
                  background: "#555",
                  width: 8,
                  height: 8,
                }}
              />
              <Handle
                type="source"
                position={Position.Right}
                id={`source__${tableName}__${f.name}`}
                style={{
                  top: topPosition,
                  background: "#555",
                  width: 8,
                  height: 8,
                }}
              />
            </React.Fragment>
          );
        })}

      {/* Si está colapsado, usamos un único handle arriba y abajo */}
      {!isExpanded && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            style={{
              background: "#555",
              width: 8,
              height: 8,
            }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            style={{
              background: "#555",
              width: 8,
              height: 8,
            }}
          />
        </>
      )}

      {/* Contenido del nodo */}
      <div className="p-2">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium">{tableName}</span>
          <button
            onClick={handleToggle}
            className="text-xs text-blue-600 hover:underline"
            style={{ lineHeight: 1 }}
          >
            {isExpanded ? "Cerrar" : "Ver detalles"}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-1">
            <div className="overflow-y-auto max-h-32">
              {fields.length === 0 ? (
                <p className="text-xs text-gray-500 italic">(Sin campos)</p>
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
    </div>
  );
};

export default TableNode;
