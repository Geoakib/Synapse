"""
The Server (State Manager)
Role: The Orchestrator. Serves the UI and simulates the "Intelligence" by injecting real-time status.
Uses FastAPI for high-performance async web serving.
"""

import random
import argparse
import os
import sys
from typing import Dict, Any
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from analyzer import CodebaseAnalyzer
import uvicorn

# --- 1. SETUP ARGUMENT PARSER ---
# This allows you to run: python server.py --path /path/to/your/code
parser = argparse.ArgumentParser(description="Synapse: SOTA Codebase Topology Visualizer")
parser.add_argument(
    "--path",
    type=str,
    default=".",
    help="The absolute or relative path to the codebase you want to analyze."
)

# Parse args. Note: We use parse_known_args to avoid conflict with Uvicorn if needed
args, unknown = parser.parse_known_args()

# Validate the path
TARGET_DIRECTORY = os.path.abspath(args.path)

if not os.path.exists(TARGET_DIRECTORY):
    print(f"[ERROR] The directory '{TARGET_DIRECTORY}' does not exist.")
    sys.exit(1)

print(f"------------ SYNAPSE ------------")
print(f"[SCAN] Analyzing Target: {TARGET_DIRECTORY}")
print(f"---------------------------------")

app = FastAPI()

# --- 2. INITIALIZE ANALYZER WITH EXTERNAL PATH ---
analyzer = CodebaseAnalyzer(TARGET_DIRECTORY)
analyzer.scan()

# Templates and Static files configuration
current_script_dir = os.path.dirname(os.path.abspath(__file__))
templates_dir = os.path.join(current_script_dir, "templates")
static_dir = os.path.join(current_script_dir, "static")
templates = Jinja2Templates(directory=templates_dir)

# Mount static files
from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

from pydantic import BaseModel

class DirectoryRequest(BaseModel):
    path: str

@app.post("/api/rescan")
async def rescan_codebase():
    """Triggers a full re-scan of the target directory."""
    global mock_health_store
    mock_health_store = {}  # Clear stale health data
    analyzer.scan()
    return {"status": "success", "message": "Codebase rescanned."}

@app.post("/api/set_target")
async def set_target_directory(request: DirectoryRequest):
    """Updates the target directory and rescans."""
    global analyzer, TARGET_DIRECTORY, mock_health_store
    
    new_path = request.path
    if not os.path.exists(new_path) or not os.path.isdir(new_path):
        return {"status": "error", "message": "Invalid directory path."}
        
    TARGET_DIRECTORY = new_path
    mock_health_store = {} # Clear health data
    
    # Re-initialize analyzer with new path
    analyzer = CodebaseAnalyzer(TARGET_DIRECTORY)
    analyzer.scan()
    
    return {"status": "success", "message": f"Switched to {new_path}"}

@app.get("/api/cycles")
async def get_cycles():
    """Returns detected circular dependencies in the codebase."""
    cycles = analyzer.detect_cycles()
    return {"cycles": cycles, "count": len(cycles)}

import time

# Global health store to simulate persistent state
mock_health_store = {}

def get_file_health(file_path: str) -> str:
    """
    Determines health status based on file modification time.
    - Active: Modified within last 7 days
    - Warning: Modified within last 30 days
    - Down: Not modified in 30+ days or file missing
    """
    try:
        full_path = os.path.join(TARGET_DIRECTORY, file_path)
        if not os.path.exists(full_path):
            return "down"
        
        mtime = os.path.getmtime(full_path)
        age_days = (time.time() - mtime) / 86400  # Convert seconds to days
        
        if age_days < 7:
            return "active"
        elif age_days < 30:
            return "warning"
        else:
            return "down"
    except (OSError, PermissionError):
        return "down"

@app.get("/graph-data")
async def get_graph_data():
    """
    Returns the graph structure (nodes/edges) + dynamic health status.
    Uses file modification time for intelligent health detection.
    """
    # 1. Get base structure from analyzer
    cy_data = analyzer.get_cytoscape_data()
    elements = cy_data["elements"]
    
    # 2. Inject Health Statuses based on file age
    for node in elements["nodes"]:
        file_label = node["data"]["label"]
        node["data"]["health"] = get_file_health(file_label)

    return elements

if __name__ == "__main__":
    # Print a clickable link for better UX
    print(f"Synapse is live at: http://127.0.0.1:8001")
    uvicorn.run(app, host="127.0.0.1", port=8001)
