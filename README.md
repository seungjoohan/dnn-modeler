# DNN Modeler

An interactive web-based GUI for building and testing deep learning models. This tool allows users to:

- Import and use pre-defined neural network / operations blocks (Transformers, Encoders/Decoders, Conv layers, etc.)
- Build custom models through an intuitive drag-and-drop interface
- Test models with small datasets for quick validation
- Train models for a few epochs to verify functionality

## Features

- Interactive model building interface
- Pre-defined neural network components
- Quick model testing capabilities
- Support for custom datasets
- Real-time model validation

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

## Project Structure

```
dnn-modeler/
├── backend/           # FastAPI backend
<!-- │   ├── models/       # Neural network components -->
│   ├── main.py          # API endpoints
│   └── utils.py      # Utility functions
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── App.tsx
<!-- │   │   └── pages/ -->
│   └── public/
└── tests/            # Test files
```

## License

Apache License 2.0