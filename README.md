# DNN Modeler

An interactive web-based GUI for building and testing deep learning models. This tool allows users to:

- Import and use pre-defined neural network / operations blocks (Transformers, Encoders/Decoders, Conv layers, etc.)
- Build and implement custom models through an intuitive drag-and-drop interface
- Train models for a few epochs to verify functionality
- Test models with small datasets for quick validation
- Display metric results and save models in desired format


## Features

- Interactive model building interface
- Pre-defined neural network layers / componenets
- Intermediate layers compatibility checks

- Coming Features:
    - Quick model testing capabilities
        - Short loop training
        - custom / pre-loaded dataset
    - Real-time model validation 
        - Metrics of choice
        - Custom loss function
    - Load and modify models
    - Export models in desired format

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Start the development servers:

Backend:
```bash
uvicorn backend.main:app --reload
```

Frontend:
```bash
cd frontend
npm run dev
```

## License

Apache License 2.0