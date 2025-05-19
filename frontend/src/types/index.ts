export interface Block {
  name: string;
  type: string;
  parameters: string[];
}

export type OutputLayerType = 'linear' | 'convolution';

export interface ModelConfig {
  input_shape: string;
  blocks: Block[];
  output_layer_type: OutputLayerType;
  output_shape: number;
} 