import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function CustomBlockNode({ id, data }: NodeProps) {
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
      <div style={{ fontWeight: 700, fontSize: 16 }}>{data.label || 'Block'}</div>
      {/* 파라미터 프리뷰 */}
      {data.parameters && Object.keys(data.parameters).length > 0 && (
        <div style={{ fontSize: 4, color: '#555', marginTop: 4 }}>
          {Object.entries(data.parameters).map(([k, v]) => (
            <div key={k}>{k}: {String(v)}</div>
          ))}
        </div>
      )}
      <IconButton
        size="small"
        sx={{ position: 'absolute', top: 2, right: 2, color: '#d32f2f' }}
        onClick={data.onDelete}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      <Handle type="target" position={Position.Top} style={{ background: '#1976d2' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#1976d2' }} />
    </Box>
  );
} 