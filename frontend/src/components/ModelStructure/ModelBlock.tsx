import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Box, Typography } from '@mui/material';

interface ModelBlockData {
  label: string;
  type: string;
  parameters: Record<string, any>;
  input_shape?: any[];
  output_shape?: any[];
  error?: string;
}

const ModelBlock = memo(({ data }: NodeProps<ModelBlockData>) => {
  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: 1,
        backgroundColor: '#f0f0f0',
        border: '1px solid #ccc',
        minWidth: 150,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {data.label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Type: {data.type}
      </Typography>
      {data.input_shape && (
        <Typography variant="caption" color="primary">
          input: {JSON.stringify(data.input_shape)}
        </Typography>
      )}
      {data.output_shape && (
        <Typography variant="caption" color="secondary">
          output: {JSON.stringify(data.output_shape)}
        </Typography>
      )}
      {data.error && (
        <Typography variant="caption" color="error">
          error: {data.error}
        </Typography>
      )}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      {/* 노드의 모든 props 출력 */}
      <pre style={{ fontSize: 10, background: '#f5f5f5', borderRadius: 4, padding: 4, marginTop: 8 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </Box>
  );
});

ModelBlock.displayName = 'ModelBlock';

export { ModelBlock }; 