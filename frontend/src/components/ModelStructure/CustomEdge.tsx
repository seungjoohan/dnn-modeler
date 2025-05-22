import React, { memo } from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';

interface CustomEdgeData {
  incompatible?: boolean;
  onDeleteEdge?: (edgeId: string) => void;
  edgeId?: string;
}

const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<CustomEdgeData>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof data?.onDeleteEdge === 'function' && data?.edgeId) {
      data.onDeleteEdge(data.edgeId);
    }
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: '#b1b1b7',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fff',
            border: data?.incompatible ? '2px solid #d32f2f' : '1px solid #bbb',
            borderRadius: 12,
            padding: 2,
            zIndex: 9999,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'all',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          onClick={handleDelete}
        >
          <CloseIcon fontSize="small" style={{ color: '#d32f2f' }} />
          {data?.incompatible && <WarningIcon color="error" fontSize="small" />}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';

export default CustomEdge; 