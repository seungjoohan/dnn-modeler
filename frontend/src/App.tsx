import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
import WarningIcon from '@mui/icons-material/Warning';

const initialNodes: Node[] = [
  {
    id: 'input',
    type: 'input',
    data: { label: 'Input Layer', parameters: { shape: '' }, shapePlaceholder: 'e.g. 784, (3,384,384), or (50, 512)' },
    position: { x: 250, y: 0 },
  },
  {
    id: 'output',
    type: 'output',
    data: { label: 'Output Layer', parameters: { } },
    position: { x: 250, y: 400 },
  },
];

const initialEdges: Edge[] = [];

const App: React.FC = () => {
  const [nodes, setNodes] = React.useState<Node[]>(initialNodes);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [errorBlocks, setErrorBlocks] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [compatibilityMap, setCompatibilityMap] = useState<Record<string, any>>({});

  // nodeTypes, edgeTypes를 useMemo로 감싸서 선언
  const nodeTypes: NodeTypes = useMemo(() => ({
    input: (props) => <CustomBlockNode {...props} />,
    output: (props) => <CustomBlockNode {...props} />,
    customBlock: (props) => <CustomBlockNode {...props} />,
  }), []);
  const edgeTypes: EdgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);

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

  // 파라미터 값 타입 변환 함수 추가
  function parseParamValue(key: string, value: any) {
    if (typeof value === 'string') {
      // 숫자
      if (/^-?\d+$/.test(value)) return Number(value);
      // 튜플/리스트 (예: "(1, 2, 3)")
      if (/^\(.*\)$/.test(value)) {
        try {
          return JSON.parse(value.replace(/\((.*)\)/, '[$1]'));
        } catch {
          return value;
        }
      }
    }
    return value;
  }

  // getNodeWithDefaults를 최상단에 정의
  const getNodeWithDefaults = (node: Node | undefined) => {
    if (!node) return undefined;
    if (node.id === 'input' || node.id === 'output') {
      // input/output도 변환 적용
      const paramObj: Record<string, any> = {};
      Object.entries(node.data.parameters).forEach(([k, v]) => {
        paramObj[k] = parseParamValue(k, v);
      });
      return {
        id: node.id,
        type: node.type,
        name: node.data.label,
        parameters: paramObj,
      };
    }
    const block = availableBlocks.find(b => b.type === node.data.blockType);
    const paramDefs = block?.parameters || {};
    const params: Record<string, any> = { ...node.data.parameters };
    Object.entries(paramDefs).forEach(([k, v]: [string, any]) => {
      if (!params[k] || params[k] === '') params[k] = v.default ?? '';
      params[k] = parseParamValue(k, params[k]);
    });
    return {
      id: node.id,
      type: node.data.blockType,
      name: block?.name || node.data.label,
      parameters: params,
    };
  };

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
      paramObj = typeof block.parameters === "object" && block.parameters !== null ? { ...block.parameters } : {};
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

  // edgesWithType 생성 시 compatibilityMap 반영
  const edgesWithType = edges.map(edge => {
    const compatKey = `${edge.source}->${edge.target}`;
    const compat = compatibilityMap[compatKey] || {};
    return {
      ...edge,
      type: 'custom',
      data: {
        ...edge.data,
        edgeId: edge.id,
        onDeleteEdge: handleDeleteEdge,
        incompatible: compat.compatible === false,
        error: compat.error || undefined,
      },
    };
  });

  // nodesWithHandlers: compatibilityMap만 사용해서 output_shape, error 표시
  const nodesWithHandlers = useMemo(
    () =>
      nodes.map(node => {
        // compatible한 엣지의 output_shape, error를 target 노드에 표시
        let outputShape = undefined;
        let error = undefined;
        Object.entries(compatibilityMap).forEach(([key, value]) => {
          const [src, tgt] = key.split('->');
          if (tgt === node.id && value.compatible && value.output_shape) {
            outputShape = value.output_shape;
          }
          if (tgt === node.id && value.error) {
            error = value.error;
          }
        });
        return node.type === 'customBlock'
          ? {
              ...node,
              data: {
                ...node.data,
                type: node.type,
                output_shape: outputShape,
                error: error,
                onDelete: () => handleDeleteNode(node.id),
              },
            }
          : {
              ...node,
              data: {
                ...node.data,
                output_shape: outputShape,
                error: error,
              },
            };
      }),
    [nodes, compatibilityMap, handleDeleteNode]
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
    setEdges(eds => [
      ...eds,
      {
        ...connection,
        id: `${connection.source}-${connection.target}`,
        type: 'custom',
        data: {},
      } as Edge
    ]);
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
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
    if (
      !inputNode ||
      !inputNode.data.parameters?.shape 
    ) {
      alert('Define Input layer');
      return;
    }

    // 파라미터 default 값 채우기
    const middleNodes = nodes.filter(n => n.id !== 'input');

    const inputNodeObj = getNodeWithDefaults(inputNode);
    const allNodes = [inputNodeObj, ...middleNodes.map(getNodeWithDefaults)];

    const payload = {
      input: inputNodeObj,
      nodes: allNodes,
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

  // edge가 변경될 때만 check-compatibility 호출
  useEffect(() => {
    if (edges.length === 0) return;
    // input/output/middle 노드를 getNodeWithDefaults로 변환
    const inputNode = nodes.find(n => n.id === 'input');
    const outputNode = nodes.find(n => n.id === 'output');
    const middleNodes = nodes.filter(n => n.id !== 'input' && n.id !== 'output');
    const inputNodeObj = getNodeWithDefaults(inputNode);
    const outputNodeObj = getNodeWithDefaults(outputNode);
    const allNodes = [inputNodeObj, ...middleNodes.map(getNodeWithDefaults), outputNodeObj];
    fetch('http://localhost:8000/check-compatibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes: allNodes, edges }),
    })
      .then(res => res.json())
      .then(compatMap => {
        setCompatibilityMap(compatMap);
      });
  }, [edges, nodes]);

  // input~output까지 연결된 path가 있는지 확인하는 함수
  function hasInputToOutputPath(nodes, edges) {
    const idSet = new Set(nodes.map(n => n.id));
    const graph = {};
    nodes.forEach(n => { graph[n.id] = []; });
    edges.forEach(e => {
      if (idSet.has(e.source) && idSet.has(e.target)) {
        graph[e.source].push(e.target);
      }
    });
    // BFS
    const queue = ['input'];
    const visited = new Set();
    while (queue.length) {
      const curr = queue.shift();
      if (curr === 'output') return true;
      visited.add(curr);
      for (const next of graph[curr] || []) {
        if (!visited.has(next)) queue.push(next);
      }
    }
    return false;
  }

  const allCompatible = useMemo(() =>
    Object.values(compatibilityMap).every(edge => edge.compatible),
    [compatibilityMap]
  );

  const canBuildModel = useMemo(() => {
    const inputNode = nodes.find(n => n.id === 'input');
    const outputNode = nodes.find(n => n.id === 'output');
    return (
      !!inputNode &&
      !!outputNode &&
      hasInputToOutputPath(nodes, edges) &&
      allCompatible
    );
  }, [nodes, edges, allCompatible]);

  return (
    <Box sx={{ flexGrow: 1, p: 0, m: 0, background: '#f5f6fa', minHeight: '100vh', width: '100vw' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', pl: 4, pt: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>DNN Modeler</Typography>
        <Button variant="contained" color="primary" sx={{ ml: 2, height: 40 }} onClick={handleBuildModel} disabled={!canBuildModel}>BUILD!</Button>
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
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
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