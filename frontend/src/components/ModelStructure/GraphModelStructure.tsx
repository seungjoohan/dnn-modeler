import React, { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
  type EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface GraphModelStructureProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  onEdgeClick?: (event: any, edge: Edge) => void;
  onNodeClick?: (event: any, node: Node) => void;
}

const GraphModelStructure: React.FC<GraphModelStructureProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  edgeTypes,
  onEdgeClick,
  onNodeClick,
}) => {
  return (
    <div style={{ width: '100%', height: '70vh', background: '#f5f6fa', borderRadius: 8 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onEdgeClick={onEdgeClick}
        onNodeClick={onNodeClick}
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default function GraphModelStructureWithProvider(props: GraphModelStructureProps) {
  return (
    <ReactFlowProvider>
      <GraphModelStructure {...props} />
    </ReactFlowProvider>
  );
} 