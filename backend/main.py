from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import torch
import torch.nn as nn
from .utils import check_node_compatibility, parse_shape_string

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
        input_shape = parse_shape_string(payload.get("input", {}).get("parameters", {}).get("shape", 10))
        output_shape = parse_shape_string(payload.get("output", {}).get("parameters", {}).get("shape", 10))
        layers = []
        for node in nodes:
            name = node.get("name")
            params = node.get("parameters", {})
            is_compatible, error_message = check_node_compatibility(node, input_shape)
            if not is_compatible:
                print("failed due to ", error_message)
                return {"status": "error", "detail": error_message}
            
            if name == "Conv2d":
                layers.append(nn.Conv2d(
                    in_channels=params.get("in_channels", 1),
                    out_channels=params.get("out_channels", 1),
                    kernel_size=params.get("kernel_size", 3),
                    stride=params.get("stride", 1),
                    padding=params.get("padding", 0)
                ))
            elif name == "Linear":
                layers.append(nn.Linear(
                    in_features=params.get("in_features", 1),
                    out_features=params.get("out_features", 1)
                ))
            elif name == "TransformerEncoder":
                encoder_layer = nn.TransformerEncoderLayer(
                    d_model=params.get("d_model", 32),
                    nhead=params.get("nhead", 2),
                    dim_feedforward=params.get("dim_feedforward", 64)
                )
                layers.append(nn.TransformerEncoder(encoder_layer, num_layers=params.get("num_layers", 1)))
            elif name == "TransformerDecoder":
                decoder_layer = nn.TransformerDecoderLayer(
                    d_model=params.get("d_model", 32),
                    nhead=params.get("nhead", 2),
                    dim_feedforward=params.get("dim_feedforward", 64)
                )
                layers.append(nn.TransformerDecoder(decoder_layer, num_layers=params.get("num_layers", 1)))
            else:
                return {"status": "error", "detail": f"Unknown block: {name}"}
            input_shape = layers[-1].out_features
        
        # output layer 추가
        if not layers:
            error_message = "No layers to build"
            return {"status": "error", "detail": error_message}
        layers.append(nn.Linear(layers[-1].out_features, output_shape))
        
        model = nn.Sequential(*layers)
        model_str = str(model)
        print(model_str)
        return {"status": "success", "model_summary": model_str}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 