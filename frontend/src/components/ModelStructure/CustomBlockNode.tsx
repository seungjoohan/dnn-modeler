import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface CustomBlockNodeProps extends NodeProps {
  nodeShapes?: Record<string, any>;
}

export default function CustomBlockNode({ id, data, nodeShapes }: CustomBlockNodeProps) {
  const shapeInfo = data.shapeInfo;
  return (
    <Box sx={{
      background: '#fff',
      border: '2px solid #1976d2',
      borderRadius: 2,
      boxShadow: 2,
      p: 2,
      minWidth: 120,
      minHeight: 60,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ fontWeight: 700, fontSize: 12 }}>{data.label || 'Block'}</div>
      {/* 파라미터 프리뷰: Output Layer는 숨김 */}
      {data.type !== 'output' && data.parameters && Object.keys(data.parameters).length > 0 && (
        <div style={{ fontSize: 6, color: '#555', marginTop: 4 }}>
          <b>Parameters:</b>
          <ul style={{ margin: 0, paddingLeft: 12 }}>
            {Object.entries(data.parameters).map(([k, v]) => (
              <li key={k} style={{ listStyle: 'disc', fontSize: 6 }}>{k}: {String(v)}</li>
            ))}
          </ul>
        </div>
      )}
      {/* shape info */}
      {nodeShapes && nodeShapes[id]?.input_shape && (
        <div style={{ fontSize: 6, color: '#888' }}>in: {JSON.stringify(nodeShapes[id].input_shape)}</div>
      )}
      {/* output_shape 프리뷰 */}
      {data.output_shape && (
        <div style={{ fontSize: 6, color: '#888', marginTop: 4 }}>
          <b>Output shape:</b> {Array.isArray(data.output_shape) ? `[${data.output_shape.join(', ')}]` : String(data.output_shape)}
        </div>
      )}
      {nodeShapes && nodeShapes[id]?.error && (
        <div style={{ color: 'red', fontSize: 6, fontWeight: 700 }}>
          &#9888; {nodeShapes[id].error}
        </div>
      )}
      {/* X(삭제) 버튼: input/output 노드는 숨김, 그 외에는 항상 표시 */}
      {(data.type) && (
        <IconButton
          size="small"
          sx={{ position: 'absolute', top: 2, right: 2, color: '#d32f2f', zIndex: 10 }}
          onClick={e => {
            e.stopPropagation();
            data.onDelete();
          }}
          aria-label="delete-node"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
      <Handle type="target" position={Position.Top} style={{ background: '#1976d2' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#1976d2' }} />
    </Box>
  );
} 