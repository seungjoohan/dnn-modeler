import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow';
import CloseIcon from '@mui/icons-material/Close';

const CustomEdge: React.FC<EdgeProps<any>> = (props) => {
  const { id, sourceX, sourceY, targetX, targetY, selected, data } = props;
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof data?.onDeleteEdge === 'function' && data?.edgeId) {
      data.onDeleteEdge(data.edgeId);
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} {...props} />
      {selected && (
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fff',
            border: '1px solid #d32f2f',
            borderRadius: 12,
            padding: 2,
            zIndex: 9999,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'all',
          }}
          onClick={handleDelete}
        >
          <CloseIcon fontSize="small" style={{ color: '#d32f2f' }} />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge; 