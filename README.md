# Synapse - SOTA Codebase Topology & Health Visualization

A professional-grade system for visualizing Python codebase structure and simulating real-time health monitoring using state-of-the-art architecture.

## Architecture Overview

Synapse consists of three professional-grade components:

### 1. The Graph Engine (Analyzer)

**File**: `analyzer.py`
**Role**: Logic Core

Uses Abstract Syntax Trees (AST) to walk your folder, read every Python file, understand import statements, and map dependencies. Instead of simple strings, it builds a NetworkX-style graph object allowing mathematical analysis such as:

- Detecting circular dependencies
- Identifying "hub" files (high coupling points)
- Topological sorting

### 2. The State Manager (FastAPI Server)

**File**: `server.py`
**Role**: The Orchestrator

Uses FastAPI (faster than Flask) to:

- Accept command-line arguments for target directory specification
- Separate Graph Topology (static) from Health State (dynamic)
- Serve the reactive UI from Synapse installation directory
- Provide real-time health status updates via REST API
- Simulate intelligent monitoring with dynamic status injection

### 3. The Reactive UI

**File**: `templates/index.html`
**Role**: The Visualization

Uses a polling mechanism to:

- Merge topology and status on the client side
- Provide smooth, real-time rendering
- Display color-coded health states (Active/Warning/Down)
- Update every 3 seconds to reflect live health checks

## Features

- **Decoupled Architecture**: Install Synapse once, analyze any project on your system via command-line arguments
- **Topological Accuracy**: Uses AST parsing (how Python interpreters actually read code) for mathematically perfect graph generation vs. regex scanning
- **Separation of Concerns**: Graph structure is cached (lightweight), while status updates are dynamic
- **Real-time Monitoring**: Simulates enterprise-grade monitoring like Datadog or New Relic
- **Modern Tech Stack**: FastAPI + Jinja2 + Cytoscape.js for optimal performance

## Installation

### Prerequisites

- Python 3.8+
- pip

### Install Dependencies

```bash
pip install -r requirements.txt
```

## Directory Structure

```
/Synapse
   ├── analyzer.py          # Graph Engine
   ├── server.py            # State Manager (FastAPI)
   ├── requirements.txt     # Python dependencies
   ├── templates/
   │     └── index.html     # Reactive UI
   └── README.md
```

## Usage

Synapse is fully decoupled from your target codebase. You can install it once and use it to analyze any project on your system.

### 1. Start the Server

#### Option A: Analyze Current Directory

```bash
python server.py
```

#### Option B: Analyze External Project

```bash
# Windows
python server.py --path "C:\Users\YourName\Documents\MyProject"

# Linux/Mac
python server.py --path /home/yourname/projects/my-app
```

#### Option C: Analyze Relative Path

```bash
python server.py --path ../another-project
```

### 2. Open in Browser

Navigate to:

```
http://127.0.0.1:8001
```

You will see:

- Your actual Python file structure visualized as a dependency graph
- Color-coded nodes indicating health status:
  - **Green**: Active/Healthy
  - **Yellow**: Warning
  - **Red**: Down/Critical
- Live updates every 3 seconds

## Health Status Simulation

Currently, the system randomly assigns health states to demonstrate the visualization. In a production environment, you would replace this with:

- Database health checks
- Microservice pings
- CI/CD pipeline status
- Test coverage metrics
- Performance monitoring data

**File**: `server.py`, line 68-79 in the `get_graph_data()` function

## Advanced Configuration

### Modify Update Interval

Edit `templates/index.html`, line 67:

```javascript
setInterval(fetchAndRender, 3000);  // Change 3000 to desired milliseconds
```

### Customize Health Status Logic

Edit `server.py`, `get_graph_data()` function to integrate with your monitoring systems:

```python
# Replace random assignment with real health checks
status = check_service_health(filename)  # Your custom function
```

### Extend Graph Analysis

The `CodebaseAnalyzer` class can be extended to:

- Detect circular dependencies
- Calculate coupling metrics
- Identify critical path files
- Generate complexity reports

## Technology Stack

- **Python AST**: For accurate code parsing
- **FastAPI**: High-performance async web framework
- **Uvicorn**: ASGI server
- **Jinja2**: Template engine
- **Cytoscape.js**: Physics-based graph visualization

## Why This Architecture is SOTA

1. **AST-Based Analysis**: Unlike regex-based scanners, AST parsing provides compiler-level accuracy
2. **Async Performance**: FastAPI with Uvicorn delivers production-grade speed
3. **Separation of Concerns**: Static topology cached separately from dynamic health state
4. **Scalable Pattern**: Mirrors architecture used by enterprise monitoring platforms
5. **Mathematical Foundation**: Graph structure enables algorithmic analysis beyond visualization

## Troubleshooting

### No Graph Appears

- Check that the target directory contains Python files
- Verify the path provided to `--path` exists and is correct
- Verify `templates/` folder exists in the same directory as `server.py`

### Invalid Path Error

```
❌ Error: The directory 'X:\path\to\project' does not exist.
```

- Double-check the path spelling and ensure it exists
- Use absolute paths or verify relative paths are correct from your current location

### Import Errors

- Run: `pip install -r requirements.txt`
- Ensure Python 3.8+ is installed

### Port Already in Use

The default port is 8001. To change it, edit `server.py`, line 73:

```python
uvicorn.run(app, host="127.0.0.1", port=8001)  # Change port number
```

## Future Enhancements

- Integration with pytest for test coverage overlay
- Git blame data for code ownership mapping
- Performance profiling integration
- Export to GraphML/DOT formats
- Circular dependency detection with alerts
- Real-time collaboration features

## License

This project is provided as-is for educational and professional use.

## Contributing

Contributions are welcome! This architecture demonstrates enterprise patterns and can be extended in many directions.
