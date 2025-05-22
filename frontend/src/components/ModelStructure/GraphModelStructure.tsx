import React, { useCallback, useEffect, useState } from 'react';
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
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@mui/material';
import type { Block } from '../../types';
import { InputLayer } from './InputLayer';
import { OutputLayer } from './OutputLayer';
import { ModelBlock } from './ModelBlock';
import CustomEdge from './CustomEdge';

interface GraphModelStructureProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onEdgeClick?: (event: any, edge: Edge) => void;
  onNodeClick?: (event: any, node: Node) => void;
  nodeTypes: NodeTypes;
  edgeTypes: EdgeTypes;
}

// Define nodeTypes and edgeTypes outside the component
const nodeTypes: NodeTypes = {
  input: InputLayer,
  output: OutputLayer,
  modelBlock: ModelBlock,
  customBlock: ModelBlock,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

const GraphModelStructure: React.FC<GraphModelStructureProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onEdgeClick,
  onNodeClick,
  nodeTypes,
  edgeTypes,
}) => {
  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
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
    </Box>
  );
};

export default function GraphModelStructureWithProvider(props: GraphModelStructureProps) {
  return (
    <ReactFlowProvider>
      <GraphModelStructure {...props} />
    </ReactFlowProvider>
  );
} 