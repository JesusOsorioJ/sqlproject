// src/components/Diagram.tsx
import React, { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  ConnectionMode,
  MarkerType,
} from "react-flow-renderer";
import type { NodeTypes } from "react-flow-renderer";
import {
  useSchema,
  type TableDef,
  type FieldDef,
  type Relationship,
} from "../contexts/SchemaContext";

import TableNode from "./TableNode";

interface DiagramProps {
  className?: string;
  onTableSelect: (tableName: string) => void;
}

export default function Diagram({
  className,
  onTableSelect,
}: DiagramProps) {
  const { fullState, loading, removeRelationship } = useSchema();

  // Estados de React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>(
    []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>(
    []
  );

  // Seguimiento de nodos expandidos
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set()
  );

  // Función para alternar expansión
  const toggleExpand = (tableName: string) => {
    setExpandedNodes((prev) => {
      const copy = new Set(prev);
      if (copy.has(tableName)) copy.delete(tableName);
      else copy.add(tableName);
      return copy;
    });
  };

  // 1) Reconstruir nodos y aristas cuando cambie el esquema o expandedNodes
  useMemo(() => {
    if (!fullState || loading) return;

    // Nodos: type = "tableNode"
    const newNodes: Node[] = fullState.schema.tables.map(
      (table: TableDef, idx: number) => ({
        id: table.name,
        type: "tableNode",
        position: { x: 220 * idx, y: 20 },
        data: {
          tableName: table.name,
          fields: table.fields,
          onOpenEditor: onTableSelect,
          isExpanded: expandedNodes.has(table.name),
          toggleExpand,
          // Si cerramos el nodo, seteamos selectedTable="" en App
          closeEditor: () => onTableSelect(""),
        },
      })
    );

    // Aristas para cada relación
    const newEdges: Edge[] = fullState.schema.relationships.map(
      (rel: Relationship, idx: number) => ({
        id: `rel-${idx}`,
        source: rel.sourceTable,
        target: rel.targetTable,
        label: `${rel.sourceField} → ${rel.targetField}`,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#555", strokeWidth: 1.5 },
        labelBgStyle: { fill: "#fff", fillOpacity: 0.8 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#555",
        },
      })
    );

    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    fullState?.schema.tables,
    fullState?.schema.relationships,
    loading,
    expandedNodes,
    onTableSelect,
    setNodes,
    setEdges,
  ]);

  // 2) Memoizar nodeTypes para evitar warnings de React Flow
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      tableNode: TableNode,
    }),
    []
  );

  // 3) Eliminar relación con doble clic en el edge
  const onEdgeDoubleClick = (
    _evt: React.MouseEvent,
    edge: Edge
  ) => {
    if (!fullState) return;
    const idx = fullState.schema.relationships.findIndex(
      (rel) =>
        rel.sourceTable === edge.source &&
        rel.targetTable === edge.target &&
        `${rel.sourceField} → ${rel.targetField}` === edge.label
    );
    if (idx >= 0) {
      removeRelationship(idx);
    }
  };

  return (
    <div
      className={className}
      style={{ width: "100%", height: "500px" }}
    >
      {loading || !fullState ? (
        <p>Cargando esquema…</p>
      ) : fullState.schema.tables.length === 0 ? (
        <p>No hay tablas en el esquema.</p>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeDoubleClick={onEdgeDoubleClick}
          fitView
          connectionMode={ConnectionMode.Loose}
          nodeTypes={nodeTypes}
        >
          <Background color="#eee" gap={12} />
          <Controls />
        </ReactFlow>
      )}
    </div>
  );
}
