import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography, Grid, Button, TextField, Drawer } from '@mui/material';
import GraphModelStructure from './components/ModelStructure/GraphModelStructure';
import CustomBlockNode from './components/ModelStructure/CustomBlockNode';
import { AvailableBlocks } from './components/AvailableBlocks';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
  type EdgeTypes,
} from 'reactflow';
import type { Block } from './types';
import CustomEdge from './components/ModelStructure/CustomEdge';

const initialNodes: Node[] = [
  {
    id: 'input',
    type: 'input',
    data: { label: 'Input Layer', parameters: { shape: '' }, shapePlaceholder: 'e.g. 784 or (384,384,1)' },
    position: { x: 250, y: 0 },
  },
  {
    id: 'output',
    type: 'output',
    data: { label: 'Output Layer', parameters: { shape: '' } },
    position: { x: 250, y: 400 },
  },
];

const initialEdges: Edge[] = [];

const nodeTypes: NodeTypes = {
  customBlock: CustomBlockNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

const App: React.FC = () => {
  const [nodes, setNodes] = React.useState<Node[]>(initialNodes);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [errorBlocks, setErrorBlocks] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // 최초 렌더 시 백엔드에서 블록 목록 fetch
  useEffect(() => {
    setLoadingBlocks(true);
    fetch('http://localhost:8000/available-blocks')
      .then(res => {
        if (!res.ok) throw new Error('API Call Failed');
        return res.json();
      })
      .then(data => {
        setAvailableBlocks(data.blocks);
        setLoadingBlocks(false);
      })
      .catch(err => {
        setErrorBlocks(err.message);
        setLoadingBlocks(false);
      });
  }, []);

  // 블록 클릭 시 노드 추가
  const handleAddBlockNode = useCallback((block: Block) => {
    // block.parameters가 객체면 default 값으로 초기화
    let paramObj = {};
    if (block.parameters && typeof block.parameters === 'object' && !Array.isArray(block.parameters)) {
      paramObj = Object.fromEntries(
        Object.entries(block.parameters).map(([k, v]: [string, any]) => [k, v.default ?? ''])
      );
    } else if (Array.isArray(block.parameters)) {
      paramObj = Object.fromEntries(block.parameters.map((k: string) => [k, '']));
    } else {
      paramObj = { ...block.parameters };
    }

    setNodes((nds) => {
      const newId = (Math.max(0, ...nds.map(n => parseInt(n.id)).filter(n => !isNaN(n))) + 1).toString();
      const newNode: Node = {
        id: newId,
        type: 'customBlock',
        data: {
          label: block.name,
          blockType: block.type,
          parameters: paramObj, 
        },
        position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 300 },
      };
      return [...nds, newNode];
    });
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, []);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter(e => e.id !== edgeId));
  }, []);


  const edgesWithType = edges.map(edge => ({
    ...edge,
    type: 'custom',
    data: {
      ...edge.data,
      edgeId: edge.id,
      onDeleteEdge: handleDeleteEdge,
    },
  }));

  // 노드에 핸들러 주입
  const nodesWithHandlers = nodes.map(node =>
    node.type === 'customBlock'
      ? {
          ...node,
          data: {
            ...node.data,
            onDelete: () => handleDeleteNode(node.id),
          },
        }
      : { ...node } // input/output도 항상 최신 nodes의 data 사용
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => [...eds, { ...connection, id: `${connection.source}-${connection.target}` } as Edge]);
  }, []);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setDrawerOpen(true);
  }, []);

  const handleParamChange = (paramName: string, value: any) => {
    if (!selectedNode) return;
    setNodes(nds =>
      nds.map(n =>
        n.id === selectedNode.id
          ? {
              ...n,
              data: {
                ...n.data,
                parameters: {
                  ...n.data.parameters,
                  [paramName]: value,
                },
              },
            }
          : n
      )
    );
    // nodes에서 최신 selectedNode를 찾아서 갱신
    setSelectedNode(prev => {
      if (!prev) return null;
      return {
        ...prev,
        data: {
          ...prev.data,
          parameters: {
            ...prev.data.parameters,
            [paramName]: value,
          },
        },
      };
    });
  };

  // nodes가 변경될 때마다 selectedNode가 있으면 nodes에서 id로 찾아 최신값으로 갱신
  React.useEffect(() => {
    if (!selectedNode) return;
    const latest = nodes.find(n => n.id === selectedNode.id);
    if (latest) setSelectedNode(latest);
    // eslint-disable-next-line
  }, [nodes]);

  const handleBuildModel = async () => {
    // input/output layer 존재 및 shape 값 체크
    const inputNode = nodes.find(n => n.id === 'input');
    const outputNode = nodes.find(n => n.id === 'output');
    if (
      !inputNode ||
      !outputNode ||
      !inputNode.data.parameters?.shape ||
      !outputNode.data.parameters?.shape
    ) {
      alert('Define BOTH Input AND Output layer');
      return;
    }

    // 파라미터 default 값 채우기
    const getNodeWithDefaults = (node: Node | undefined) => {
      if (!node) return undefined;
      if (node.id === 'input' || node.id === 'output') {
        return {
          id: node.id,
          type: node.type,
          name: node.data.label,
          parameters: node.data.parameters,
        };
      }
      const block = availableBlocks.find(b => b.type === node.data.blockType);
      const paramDefs = block?.parameters || {};
      const params = { ...node.data.parameters };
      Object.entries(paramDefs).forEach(([k, v]) => {
        if (!params[k] || params[k] === '') params[k] = v.default ?? '';
      });
      return {
        id: node.id,
        type: node.data.blockType,
        name: block?.name || node.data.label,
        parameters: params,
      };
    };

    const middleNodes = nodes.filter(n => n.id !== 'input' && n.id !== 'output');

    const payload = {
      input: getNodeWithDefaults(inputNode),
      output: getNodeWithDefaults(outputNode),
      nodes: middleNodes.map(getNodeWithDefaults),
      edges: edges.map(e => ({
        source: e.source,
        target: e.target,
      })),
    };

    try {
      const res = await fetch('http://localhost:8000/build-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        alert('Model build failed: ' + (data.detail || 'Unknown error'));
      } else {
        alert('Model built successfully!');
      }
    } catch (err: any) {
      alert('Model build failed: ' + err.message);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 0, m: 0, background: '#f5f6fa', minHeight: '100vh', width: '100vw' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', pl: 4, pt: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>DNN Modeler</Typography>
        <Button variant="contained" color="primary" sx={{ ml: 2, height: 40 }} onClick={handleBuildModel}>BUILD!</Button>
      </Box>
      <Grid container columns={12} columnSpacing={2} sx={{ height: '80vh', width: '100vw', margin: 0 }}>
        {/* 왼쪽: Available Blocks */}
        <Box sx={{ flex: 3, height: '100%' }}>
          <AvailableBlocks
            blocks={availableBlocks}
            loading={loadingBlocks}
            error={errorBlocks}
            onBlockClick={handleAddBlockNode}
          />
        </Box>
        {/* 오른쪽: Graph */}
        <Box sx={{ flex: 9, height: '100%' }}>
          <Box sx={{ width: '100%', height: '100%' }}>
            <GraphModelStructure
              nodes={nodesWithHandlers}
              edges={edgesWithType}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodeClick={onNodeClick}
            />
          </Box>
        </Box>
      </Grid>
      {/* 파라미터 패널 (오른쪽 Drawer) */}
      <Drawer anchor="right" open={isDrawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 320, p: 3 }}>
          <Typography variant="h6" gutterBottom>{selectedNode?.data?.label || 'Block'}</Typography>
          {selectedNode && selectedNode.data.parameters && Object.entries(selectedNode.data.parameters).map(([key, value]) => (
            <TextField
              key={key}
              label={key}
              value={value}
              onChange={e => handleParamChange(key, e.target.value)}
              fullWidth
              margin="dense"
              placeholder={selectedNode.id === 'input' && key === 'shape' ? selectedNode.data.shapePlaceholder : undefined}
            />
          ))}
        </Box>
      </Drawer>
    </Box>
  );
};

export default App; 