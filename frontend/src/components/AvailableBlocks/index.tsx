import React, { useState, useMemo } from 'react';
import { Paper, Typography, List, ListItem, ListItemText, TextField, Button, Box } from '@mui/material';
import type { Block } from '../../types';

interface AvailableBlocksProps {
  blocks: Block[];
  loading: boolean;
  error: string | null;
  onBlockClick?: (block: Block) => void;
}

export const AvailableBlocks: React.FC<AvailableBlocksProps> = ({ blocks, loading, error, onBlockClick }) => {
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  // 검색 + 정렬된 blocks
  const filteredBlocks = useMemo(() => {
    let filtered = blocks;
    if (search.trim()) {
      filtered = filtered.filter(block =>
        block.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    filtered = [...filtered].sort((a, b) =>
      sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
    return filtered;
  }, [blocks, search, sortAsc]);

  // blocks가 배열이 아닐 때 방어
  if (!Array.isArray(blocks)) {
    console.error('blocks is not an array:', blocks);
    return <div style={{color: 'red'}}>blocks is not an array</div>;
  }

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%', width: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: 2, zIndex: 1 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>Available Layers</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search layers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={() => setSortAsc(a => !a)}
        >
          {sortAsc ? 'A-Z' : 'Z-A'}
        </Button>
      </Box>
      {loading && <Typography>Loading...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      <List>
        {filteredBlocks.map((block, idx) => {
          try {
            return (
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
                      <span style={{ fontSize: 12, color: '#888' }}>Parameters: {Object.keys(block.parameters).join(', ')}</span>
                    </>
                  }
                />
              </ListItem>
            );
          } catch (err) {
            console.error('Error rendering block:', block, err);
            return <ListItem key={idx} style={{color: 'red'}}>Error rendering this block</ListItem>;
          }
        })}
      </List>
    </Paper>
  );
}; 