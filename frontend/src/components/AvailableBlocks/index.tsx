import React from 'react';
import { Paper, Typography, List, ListItem, ListItemText } from '@mui/material';
import type { Block } from '../../types';

interface AvailableBlocksProps {
  blocks: Block[];
  loading: boolean;
  error: string | null;
  onBlockClick?: (block: Block) => void;
}

export const AvailableBlocks: React.FC<AvailableBlocksProps> = ({ blocks, loading, error, onBlockClick }) => (
  <Paper elevation={2} sx={{ p: 2, height: '100%', width: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: 2, zIndex: 1 }}>
    <Typography variant="h5" fontWeight={600} gutterBottom>Available Blocks</Typography>
    {loading && <Typography>Loading...</Typography>}
    {error && <Typography color="error">{error}</Typography>}
    <List>
      {blocks.map((block, idx) => (
        <ListItem
          key={block.name}
          component="button"
          onClick={() => onBlockClick && onBlockClick(block)}
          sx={{
            mb: 2,
            background: '#fff',
            borderRadius: 2,
            boxShadow: 1,
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: 3, background: '#e3f2fd' },
          }}
        >
          <ListItemText
            primary={<b>{block.name}</b>}
            secondary={
              <>
                <span style={{ fontSize: 13, color: '#666' }}>({block.type})</span><br />
                <span style={{ fontSize: 12, color: '#888' }}>Parameters: {Object.keys(block.parameters).join(', ')}</span>
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  </Paper>
); 