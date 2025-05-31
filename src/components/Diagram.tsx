// src/components/Diagram.tsx
import React, { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  addEdge,
} from "react-flow-renderer";
import { useSchema } from "../contexts/SchemaContext";
import type { TableDef, Relationship } from "../contexts/SchemaContext";

interface DiagramProps {
  className?: string;
  onTableSelect: (tableName: string) => void;
}

/**
 * Este componente solo dibuja nodos (tablas) y aristas (relaciones). 
 * Usa React Flow. Cuando el usuario hace clic en un nodo, dispara onTableSelect.
 */
export default function Diagram({
  className,
  onTableSelect,
}: DiagramProps) {
  const { fullState, loading, removeRelationship } = useSchema();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>(
    []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>(
    []
  );

  // 1) Cada vez que fullState.schema cambie, recalculamos nodos y aristas
  useMemo(() => {
    if (!fullState || loading) return;

    // ——— Nodos: un Node por cada TableDef —————————————
    const newNodes: Node[] = fullState.schema.tables.map(
      (table: TableDef, idx: number) => ({
        id: table.name,
        data: { label: table.name },
        // Posición inicial: separamos en X según idx, y en Y fijo (puedes ajustar)
        position: { x: 220 * idx, y: 20 },
        style: {
          border: "1px solid #333",
          borderRadius: 4,
          padding: 8,
          backgroundColor: "#f9f9f9",
          minWidth: 120,
          textAlign: "center",
        },
      })
    );

    // ——— Aristas: un Edge por cada Relationship —————————————
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
    setNodes,
    setEdges,
  ]);

  // 2) Manejador cuando el usuario hace clic en un nodo: onTableSelect(tableId)
  const onNodeClick = (
    _evt: React.MouseEvent,
    node: Node
  ) => {
    onTableSelect(node.id);
  };

  // 3) Permitir eliminar una relación con doble clic sobre el edge
  const onEdgeDoubleClick = (
    evt: React.MouseEvent,
    edge: Edge
  ) => {
    // Buscamos el índice de la relación en fullState.schema.relationships
    if (!fullState) return;
    const idx = fullState.schema.relationships.findIndex(
      (rel) =>
        rel.sourceTable === edge.source &&
        rel.targetTable === edge.target &&
        `${rel.sourceField} → ${rel.targetField}` ===
          edge.label
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
          onNodeClick={onNodeClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          fitView
          connectionMode={ConnectionMode.Loose}
        >
          <Background color="#eee" gap={12} />
          <Controls />
        </ReactFlow>
      )}
    </div>
  );
}
