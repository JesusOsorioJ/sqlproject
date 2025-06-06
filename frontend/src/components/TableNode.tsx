// src/components/TableNode.tsx

import React from "react";
import { Handle, Position, type NodeProps } from "react-flow-renderer";
import type { FieldDef } from "../contexts/SchemaContext";

interface TableNodeData {
  tableName: string;
  fields: FieldDef[];
  onOpenEditor: (tableName: string) => void;
}

// const NODE_WIDTH = 200;
const NODE_HEIGHT = 200;

const TableNode: React.FC<NodeProps<TableNodeData>> = ({ data }) => {
  const { tableName, fields, onOpenEditor } = data;

  // Calculamos posiciones verticales uniformes, dejando padding superior e inferior
  const totalSlots = fields.length + 1; // espacio superior e inferior
  const step = NODE_HEIGHT / totalSlots;

  return (
    <div
      className="border rounded-lg bg-gray-800 shadow-md"
      style={{
        // width: NODE_WIDTH,
        // height: NODE_HEIGHT,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Nombre de la tabla */}
      <div className="p-2 bg-gray-900 bg-[#505050] border-b text-center">
        <span className="font-semibold text-sm">{tableName}</span>
      </div>

      {/* Lista de campos */}
      <div className="flex-1 overflow-hidden">
        {fields.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs italic text-gray-500">(Sin campos)</p>
          </div>
        ) : (
          fields.map((f, idx) => {
            const yPos = step * (idx + 1);

            return (
              <React.Fragment key={f.name}>
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`target__${tableName}__${f.name}`}
                  style={{
                    top: yPos,
                    background: "#fff",
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                  }}
                />

                <Handle
                  type="source"
                  position={Position.Right}
                  id={`source__${tableName}__${f.name}`}
                  style={{
                    top: yPos,
                    background: "#fff",
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                  }}
                />

                {/* Etiqueta del campo */}
                <div
                  className="text-xs px-2 flex items-center"
                  style={{ height: step, marginTop: 0 }}
                >
                  <span className="truncate">
                    {f.name}{" "}
                    <span className="text-gray-500">
                      ({f.type}
                      {f.required ? ", req." : ""})
                    </span>
                  </span>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      <div className="p-2 bg-gray-700 border-t">
        <button
          onClick={() => onOpenEditor(tableName)}
          className="w-full px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
        >
          Editar
        </button>
      </div>
    </div>
  );
};

export default TableNode;
