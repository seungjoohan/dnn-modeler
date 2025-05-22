import torch
import torch.nn as nn

def parse_shape_string(shape_str):
    """
    Converts a shape string like '784' or '(384,384,1)' to a tuple of ints.
    """
    try:
        if isinstance(shape_str, (tuple, list)):
            return tuple(shape_str)
        if isinstance(shape_str, int):
            return (shape_str,)
        if ',' in str(shape_str) or '(' in str(shape_str):
            return tuple(int(x) for x in str(shape_str).replace('(', '').replace(')', '').split(',') if x.strip())
        else:
            return (int(shape_str),)
    except Exception:
        return None

def propagate_shapes(input_shape, nodes, edges):
    """
    Netron 스타일: 그래프를 순회하며 각 노드의 input_shape, output_shape, error를 기록
    input_shape: tuple, e.g. (3, 224, 224)
    nodes: list of node dicts (id, type, parameters, name)
    edges: list of edge dicts (source, target)
    Returns: dict {node_id: {'input_shape': ..., 'output_shape': ..., 'error': ...}}
    """
    from collections import defaultdict, deque
    id_to_node = {n['id']: n for n in nodes}
    in_degree = defaultdict(int)
    graph = defaultdict(list)
    for edge in edges:
        graph[edge['source']].append(edge['target'])
        in_degree[edge['target']] += 1
    queue = deque([n['id'] for n in nodes if in_degree[n['id']] == 0])
    node_shapes = {}
    while queue:
        nid = queue.popleft()
        node = id_to_node[nid]
        preds = [e['source'] for e in edges if e['target'] == nid]
        # input_shape 결정
        if not preds:
            node_input_shape = input_shape
        else:
            pred_shapes = [node_shapes[p]['output_shape'] for p in preds if 'output_shape' in node_shapes[p]]
            if not pred_shapes or not all(s == pred_shapes[0] for s in pred_shapes):
                node_shapes[nid] = {'input_shape': None, 'output_shape': None, 'error': 'Input shape mismatch from predecessors'}
                continue
            node_input_shape = pred_shapes[0]

        if node['type'] == 'output':
            output_shape = parse_shape_string(node.get('parameters', {}).get('shape', 10))
            node_shapes[nid] = {'input_shape': node_input_shape, 'output_shape': output_shape, 'error': None}
            continue
        try:
            dummy = torch.randn(1, *node_input_shape) if isinstance(node_input_shape, (tuple, list)) else torch.randn(1, node_input_shape)
            if node['type'] == 'linear':
                if dummy.ndim > 2:
                    dummy = dummy.view(dummy.size(0), -1)
                params = node.get('parameters') or node.get('data', {}).get('parameters', {})
                in_features = int(params['in_features'])
                out_features = int(params['out_features'])
                if dummy.size(1) != in_features:
                    raise ValueError(f"Input shape {tuple(dummy.size())} does not match Linear in_features={in_features}")
                layer = nn.Linear(in_features, out_features)
                out = layer(dummy)
                out_shape = tuple(out.size())[1:]
            elif node['type'] == 'convolution':
                in_channels = int(params['in_channels'])
                out_channels = int(params['out_channels'])
                kernel_size = int(params.get('kernel_size', 3))
                stride = int(params.get('stride', 1))
                padding = int(params.get('padding', 0))
                if dummy.ndim != 4:
                    raise ValueError(f"Input tensor must be 4D (N, C, H, W) for Conv2d, got {tuple(dummy.size())}")
                if dummy.size(1) != in_channels:
                    raise ValueError(f"Input channels {dummy.size(1)} does not match Conv2d in_channels={in_channels}")
                layer = nn.Conv2d(in_channels, out_channels, kernel_size, stride, padding)
                out = layer(dummy)
                out_shape = tuple(out.size())[1:]
            else:
                out_shape = node_input_shape
            node_shapes[nid] = {'input_shape': node_input_shape, 'output_shape': out_shape, 'error': None}
        except Exception as e:
            node_shapes[nid] = {'input_shape': node_input_shape, 'output_shape': None, 'error': str(e)}
        # 다음 노드의 in_degree 감소 및 큐 추가
        for tgt in graph[nid]:
            in_degree[tgt] -= 1
            if in_degree[tgt] == 0:
                queue.append(tgt)
    return node_shapes

def sort_by_edges(nodes, edges):
    """
    nodes: list of node dicts (each must have 'id')
    edges: list of edge dicts (each must have 'source', 'target')
    Returns: list of nodes sorted in topological order by edge direction
    """
    from collections import defaultdict, deque
    id_to_node = {n['id']: n for n in nodes}
    in_degree = defaultdict(int)
    graph = defaultdict(list)
    for edge in edges:
        graph[edge['source']].append(edge['target'])
        in_degree[edge['target']] += 1
    queue = deque([n['id'] for n in nodes if in_degree[n['id']] == 0])
    sorted_nodes = []
    while queue:
        nid = queue.popleft()
        sorted_nodes.append(id_to_node[nid])
        for tgt in graph[nid]:
            in_degree[tgt] -= 1
            if in_degree[tgt] == 0:
                queue.append(tgt)
    return sorted_nodes