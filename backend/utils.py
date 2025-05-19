import torch
import torch.nn as nn

def parse_shape_string(shape_str):
    """
    Converts a shape string like '784' or '(384,384,1)' to a tuple of ints.
    """
    try:
        if isinstance(shape_str, (tuple, list)):
            return tuple(shape_str)
        if ',' in shape_str or '(' in shape_str:
            return tuple(int(x) for x in shape_str.replace('(', '').replace(')', '').split(',') if x.strip())
        else:
            return (int(shape_str),)
    except Exception:
        return None

def check_node_compatibility(node, input_shape):
    """
    node: dict, e.g. {'type': 'linear', 'parameters': {'in_features': 128, 'out_features': 64}}
    input_shape: tuple, e.g. (128,)
    Returns (True, None) if compatible, (False, error_message) if not.
    """
    layer_type = node['type']
    params = node.get('parameters', {})
    try:
        if layer_type.lower() == 'linear':
            layer = nn.Linear(
                in_features=int(params.get('in_features', input_shape[-1])),
                out_features=int(params.get('out_features', 1))
            )
        elif layer_type.lower() == 'convolution':
            layer = nn.Conv2d(
                in_channels=int(params.get('in_channels', input_shape[1] if len(input_shape) > 1 else 1)),
                out_channels=int(params.get('out_channels', 1)),
                kernel_size=int(params.get('kernel_size', 3))
            )
        # TODO: add more layer types as needed
        else:
            return True, None  # Unknown layer, skip check

        # check if layer is compatible with input shape
        dummy = torch.randn(1, *input_shape) if isinstance(input_shape, (tuple, list)) else torch.randn(1, input_shape)
        _ = layer(dummy)
        return True, None
    except Exception as e:
        return False, f"Error checking compatibility for {node}: {e}"