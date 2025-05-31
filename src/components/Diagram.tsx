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
  type NodeTypes,
} from "react-flow-renderer";
import {
  useSchema,
  type TableDef,
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

  // Estados de nodos y aristas de React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  // Seguimiento de nodos expandidos
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Alternar expansión de un nodo
  const toggleExpand = (tableName: string) => {
    setExpandedNodes((prev) => {
      const copy = new Set(prev);
      if (copy.has(tableName)) copy.delete(tableName);
      else copy.add(tableName);
      return copy;
    });
  };

  // Reconstruir nodos y aristas cuando cambie el esquema o expandedNodes
  useMemo(() => {
    if (!fullState || loading) return;

    // 1) Construir nodos tipo "tableNode"
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
          closeEditor: () => onTableSelect(""),
        },
      })
    );

    // 2) Construir aristas con sourceHandle y targetHandle, mostrando cardinalidad
    const newEdges: Edge[] = fullState.schema.relationships.map(
      (rel: Relationship, idx: number) => ({
        id: `rel-${idx}`,
        source: rel.sourceTable,
        sourceHandle: `source__${rel.sourceTable}__${rel.sourceField}`,
        target: rel.targetTable,
        targetHandle: `target__${rel.targetTable}__${rel.targetField}`,
        label: `${rel.sourceField}→${rel.targetField} (${rel.cardinality})`,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#555", strokeWidth: 1.5 },
        labelBgStyle: { fill: "#fff", fillOpacity: 0.8, padding: "2px" },
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

  // Memoizar nodeTypes para TableNode
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      tableNode: TableNode,
    }),
    []
  );

  // Doble clic en arista para eliminar relación
  const onEdgeDoubleClick = (_evt: React.MouseEvent, edge: Edge) => {
    if (!fullState) return;
    const idx = fullState.schema.relationships.findIndex(
      (rel) =>
        rel.sourceTable === edge.source &&
        rel.targetTable === edge.target &&
        `${rel.sourceField}→${rel.targetField} (${rel.cardinality})` === edge.label
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
