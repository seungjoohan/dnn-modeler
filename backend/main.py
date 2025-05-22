from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import torch
import torch.nn as nn
from .utils import parse_shape_string, sort_by_edges, propagate_shapes

app = FastAPI(title="DNN Modeler API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ModelConfig(BaseModel):
    layers: List[Dict[str, Any]]
    input_shape: List[int]
    output_shape: List[int]

class TestConfig(BaseModel):
    model_config: ModelConfig
    dataset_path: str
    epochs: int = 3
    batch_size: int = 32

@app.get("/")
async def root():
    return {"message": "DNN Modeler API"}

@app.get("/available-blocks")
async def get_available_blocks():
    """Return list of available neural network blocks"""
    return {
        "blocks": [
            {
                "name": "Conv2d",
                "type": "convolution",
                "parameters": {
                    "in_channels": {"default": 1, "type": "int"},
                    "out_channels": {"default": 1, "type": "int"},
                    "kernel_size": {"default": 3, "type": "int"},
                    "stride": {"default": 1, "type": "int"},
                    "padding": {"default": 0, "type": "int"}
                }
            },
            {
                "name": "TransformerEncoder",
                "type": "transformer",
                "parameters": {
                    "d_model": {"default": 32, "type": "int"},
                    "nhead": {"default": 2, "type": "int"},
                    "dim_feedforward": {"default": 64, "type": "int"},
                    "num_layers": {"default": 1, "type": "int"}
                }
            },
            {
                "name": "TransformerDecoder",
                "type": "transformer",
                "parameters": {
                    "d_model": {"default": 32, "type": "int"},
                    "nhead": {"default": 2, "type": "int"},
                    "dim_feedforward": {"default": 64, "type": "int"},
                    "num_layers": {"default": 1, "type": "int"}
                }
            },
            {
                "name": "Linear",
                "type": "linear",
                "parameters": {
                    "in_features": {"default": 128, "type": "int"},
                    "out_features": {"default": 64, "type": "int"}
                }
            }
        ]
    }

@app.post("/test-model")
async def test_model(config: TestConfig):
    """Test the model configuration with a small dataset"""
    try:
        # TODO: Implement model testing logic
            # prep: download small dataset - image / text embedding / audio -> ~ 1000 samples each
            # 1. Load synthetic dataset - image / text embedding
            # 2. Preprocess dataset - auto processor
            # 3. Train model for few epochs
            # 4. Evaluate model - metrics by choice?
            # 5. Return results
        

        return {
            "status": "success",
            "message": "Model test completed",
            "results": {
                "loss": 0.0,
                "accuracy": 0.0,
                "training_time": 0.0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/build-model")
async def build_model(payload: dict = Body(...)):
    try:
        nodes = payload.get("nodes", [])
        edges = payload.get("edges", [])
        # 노드 정렬
        nodes = sort_by_edges(nodes, edges)
        input_shape = parse_shape_string(payload.get("input", {}).get("parameters", {}).get("shape", 10))
        layers = []
        for node in nodes:
            name = node.get("name")
            params = node.get("parameters", {})
            if name.lower().startswith('input') or name.lower().startswith('output'):
                continue
            if name == "Conv2d":
                in_channels = int(params.get("in_channels", 1))
                out_channels = int(params.get("out_channels", 1))
                print(f"in_channels: {in_channels}, out_channels: {out_channels}")
                kernel_size = int(params.get("kernel_size", 3))
                stride = int(params.get("stride", 1))
                padding = int(params.get("padding", 0))
                layers.append(nn.Conv2d(
                    in_channels=in_channels,
                    out_channels=out_channels,
                    kernel_size=kernel_size,
                    stride=stride,
                    padding=padding
                ))
            elif name == "Linear":
                in_features = int(params.get("in_features", 1))
                out_features = int(params.get("out_features", 1))
                layers.append(nn.Linear(in_features, out_features))
            elif name == "TransformerEncoder":
                d_model = int(params.get("d_model", 32))
                nhead = int(params.get("nhead", 2))
                dim_feedforward = int(params.get("dim_feedforward", 64))
                num_layers = int(params.get("num_layers", 1))
                encoder_layer = nn.TransformerEncoderLayer(
                    d_model=d_model,
                    nhead=nhead,
                    dim_feedforward=dim_feedforward
                )
                layers.append(nn.TransformerEncoder(encoder_layer, num_layers=num_layers))
            elif name == "TransformerDecoder":
                d_model = int(params.get("d_model", 32))
                nhead = int(params.get("nhead", 2))
                dim_feedforward = int(params.get("dim_feedforward", 64))
                num_layers = int(params.get("num_layers", 1))
                decoder_layer = nn.TransformerDecoderLayer(
                    d_model=d_model,
                    nhead=nhead,
                    dim_feedforward=dim_feedforward
                )
                layers.append(nn.TransformerDecoder(decoder_layer, num_layers=num_layers))

            else:
                return {"status": "error", "detail": f"Unknown block: {name}"}
            print(f"After {name}: input_shape={input_shape}")
        
        # import pdb; pdb.set_trace()
        # output layer
        if not layers:
            error_message = "No layers to build"
            return {"status": "error", "detail": error_message}
        
        model = nn.Sequential(*layers)
        model_str = str(model)
        print(model_str)
        return {"status": "success", "model_summary": model_str}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@app.post("/propagate-shapes")
async def propagate_shapes_api(payload: dict = Body(...)):
    print("propagate_shapes_api payload:", payload)
    input_shape = parse_shape_string(payload.get("input_shape"))
    print("parsed input_shape:", input_shape)
    nodes = payload.get("nodes", [])
    edges = payload.get("edges", [])
    result = propagate_shapes(input_shape, nodes, edges)
    print("propagate_shapes result:", result)
    return result

@app.post("/check-compatibility")
async def check_compatibility(payload: dict = Body(...)):
    nodes = payload.get("nodes", [])
    edges = payload.get("edges", [])
    input_shape = None
    for node in nodes:
        if node.get("type") == "input":
            input_shape = node.get("parameters", {}).get("shape") or node.get("data", {}).get("parameters", {}).get("shape")
            break
    if input_shape is None:
        input_shape = 10
    input_shape = parse_shape_string(input_shape)
    node_shapes = propagate_shapes(input_shape, nodes, edges)

    id_to_node = {n['id']: n for n in nodes}
    edge_compat = {}
    for edge in edges:
        src = edge["source"]
        tgt = edge["target"]

        src_shape = node_shapes.get(src, {}).get("output_shape")
        tgt_node = id_to_node.get(tgt)
        tgt_type = tgt_node.get("type")
        params = tgt_node.get('parameters') or tgt_node.get('data', {}).get('parameters', {})
        compatible = True
        error = None
        output_shape = None
        if src_shape is None:
            compatible = False
            error = "Source output shape not available"
        else:
            try:
                dummy = torch.randn(1, *src_shape) if isinstance(src_shape, (tuple, list)) else torch.randn(1, src_shape)
                if tgt_type == "linear":
                    if dummy.ndim > 2:
                        dummy = dummy.view(dummy.size(0), -1)
                    in_features = int(params["in_features"])
                    out_features = int(params["out_features"])
                    layer = nn.Linear(in_features, out_features)
                    out = layer(dummy)
                    output_shape = tuple(out.size())[1:]
                elif tgt_type == "convolution":
                    in_channels = int(params["in_channels"])
                    out_channels = int(params["out_channels"])
                    kernel_size = int(params.get("kernel_size", 3))
                    stride = int(params.get("stride", 1))
                    padding = int(params.get("padding", 0))
                    layer = nn.Conv2d(in_channels, out_channels, kernel_size, stride, padding)
                    out = layer(dummy)
                    output_shape = tuple(out.size())[1:]
                elif tgt_type == "output":
                    output_shape = src_shape
                    compatible = True
                    error = None
                else:
                    output_shape = src_shape
            except Exception as e:
                compatible = False
                error = str(e)
        edge_compat[f"{src}->{tgt}"] = {"compatible": compatible, "error": error, "output_shape": output_shape}
    return edge_compat

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 