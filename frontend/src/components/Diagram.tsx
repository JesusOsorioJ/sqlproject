// src/components/Diagram.tsx

import { useMemo, useCallback, useState, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type EdgeChange,
  ConnectionLineType,
} from "react-flow-renderer";
import dagre from "dagre";
import { useSchema, type TableDef, type Relationship } from "../contexts/SchemaContext";
import TableNode from "./TableNode";

interface DiagramProps {
  className?: string;
  onTableSelect: (tableName: string) => void;
}

// Tamaño fijo para cada nodo a la hora de calcular layout
const NODE_WIDTH = 250;
const NODE_HEIGHT = 300; // este valor puedes ajustarlo a tu gusto

// Instancia de dagre para calcular posiciones
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Definimos nodeTypes fuera del componente para que la referencia sea estable
const nodeTypes = { tableNode: TableNode };

export default function Diagram({ className, onTableSelect }: DiagramProps) {
  const { fullState, loading } = useSchema();

  // --------------------------------------------------------
  // 1) Función para obtener posiciones (layout) de nodos y edges
  // --------------------------------------------------------
  const getLayoutedElements = useCallback(
    (tables: TableDef[], relationships: Relationship[]) => {
      // Reiniciamos el grafo de dagre
      dagreGraph.setGraph({ rankdir: "LR", marginx: 250, marginy: 250 });
      dagreGraph.setDefaultEdgeLabel(() => ({}));

      // 1. Añadimos cada tabla como nodo a dagre
      tables.forEach((table) => {
        dagreGraph.setNode(table.name, { width: NODE_WIDTH, height: NODE_HEIGHT });
      });

      // 2. Añadimos cada relación como arista a dagre
      relationships.forEach((rel) => {
        dagreGraph.setEdge(rel.sourceTable, rel.targetTable);
      });

      // 3. Ejecutamos el layout
      dagre.layout(dagreGraph);

      // 4. Extraemos posiciones para nodos
      const positionedNodes: Node[] = tables.map((table: TableDef) => {
        const nodeWithPosition = dagreGraph.node(table.name)!;
        return {
          id: table.name,
          type: "tableNode",
          position: {
            x: nodeWithPosition.x - NODE_WIDTH / 2,
            y: nodeWithPosition.y - NODE_HEIGHT / 2,
          },
          draggable: true,
          data: {
            tableName: table.name,
            fields: table.fields,
            onOpenEditor: onTableSelect,
          },
        };
      });

      // 5. Creamos aristas (edges) con sus respectivos handles
      const positionedEdges: Edge[] = relationships.map((rel, idx) => ({
        id: `rel-${idx}`,
        source: rel.sourceTable,
        sourceHandle: `source__${rel.sourceTable}__${rel.sourceField}`,
        target: rel.targetTable,
        targetHandle: `target__${rel.targetTable}__${rel.targetField}`,
        label: `${rel.sourceField} → ${rel.targetField} (${rel.cardinality})`,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#555", strokeWidth: 1.2 },
        labelBgStyle: { fill: "#fff", fillOpacity: 0.8, padding: "2px" },
      }));

      return { nodes: positionedNodes, edges: positionedEdges };
    },
    [onTableSelect]
  );

  // --------------------------------------------------------
  // 2) Memoizar nodos y aristas tras cambios en el esquema
  // --------------------------------------------------------
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!fullState || loading) return { nodes: [], edges: [] };
    return getLayoutedElements(fullState.schema.tables, fullState.schema.relationships);
  }, [fullState, loading, getLayoutedElements]);

  // Estados internos para manejar arrastrar/nodos y aristas
  const [nodes, setNodes] = useState<Node[]>(layoutedNodes);
  const [edges, setEdges] = useState<Edge[]>(layoutedEdges);

  // Cuando el esquema cambie, sincronizamos los estados internos
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges]);

  // --------------------------------------------------------
  // 3) Callbacks para que ReactFlow maneje movimiento de nodos y aristas
  // --------------------------------------------------------
  interface NodesChangeHandler {
    (changes: import("react-flow-renderer").NodeChange[]): void;
  }

  const onNodesChange: NodesChangeHandler = useCallback(
    (changes: import("react-flow-renderer").NodeChange[]) => setNodes((nds: Node[]) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds: Edge[]) => applyEdgeChanges(changes, eds)),
    []
  );

  // --------------------------------------------------------
  // 4) Render
  // --------------------------------------------------------
  return (
    <div className={className} style={{ width: "100%", height: "700px" }}>
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
          fitView
          panOnScroll
          zoomOnScroll
          zoomOnPinch
          panOnDrag
          connectionLineType={ConnectionLineType.SmoothStep}
          nodesDraggable={true}
          nodesConnectable={true}
          deleteKeyCode={'46'}
          nodeTypes={nodeTypes}
        >
          <Background color="#eee" gap={12} />
          <Controls />
        </ReactFlow>
      )}
    </div>
  );
}
