import type { Node } from 'reactflow';

export interface Block {
  name: string;
  type: string;
  parameters: Record<string, {
    default: number;
    type: string;
  }>;
}

export interface BlockNode extends Node {
  data: {
    label: string;
    type: string;
    parameters: Record<string, any>;
  };
}

export interface InputNode extends Node {
  data: {
    label: string;
    shape: string;
  };
}

export interface OutputNode extends Node {
  data: {
    label: string;
    shape: string;
  };
}

export interface ModelStructure {
  nodes: (BlockNode | InputNode | OutputNode)[];
  edges: {
    id: string;
    source: string;
    target: string;
    type: string;
  }[];
}

export type OutputLayerType = 'linear' | 'convolution';

export interface ModelConfig {
  input_shape: string;
  blocks: Block[];
  output_layer_type: OutputLayerType;
  output_shape: number;
} 