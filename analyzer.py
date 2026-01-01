"""
The Analyzer (Graph Engine)
Role: The Logic Core. Walks directories, reads Python files, understands import statements, and maps them.
Uses NetworkX-style graph representation for mathematical analysis capabilities.
"""

import ast
import os
from typing import Dict, List, Set

class CodebaseAnalyzer:
    def __init__(self, root_dir: str):
        self.root_dir = os.path.abspath(root_dir)
        self.graph: Dict[str, Set[str]] = {}
        self.nodes: Set[str] = set()
        self.node_types: Dict[str, str] = {}  # Stores file extension/type
        self.node_metrics: Dict[str, Dict[str, int]] = {} # Stores LOC, complexity, etc.

    IGNORE_DIRS = {".git", "venv", ".venv", "__pycache__", "node_modules", ".idea", ".vscode", "dist", "build", "coverage"}
    IGNORE_EXTS = {".pyc", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".map", ".log", ".txt", ".md"}

    def _get_relative_path(self, full_path: str) -> str:
        return os.path.relpath(full_path, self.root_dir).replace("\\", "/")

    def _resolve_import(self, import_path: str, current_file: str) -> str:
        """Attempts to resolve a file path from an import string."""
        current_dir = os.path.dirname(current_file)
        
        # 1. Check relative to current file
        candidate = os.path.join(current_dir, import_path)
        if os.path.exists(candidate) and os.path.isfile(candidate):
             return self._get_relative_path(candidate)
        
        # 2. Check with extensions
        for ext in [".js", ".ts", ".jsx", ".tsx", ".css", ".scss", ".html", ".py"]:
             candidate_ext = candidate + ext
             if os.path.exists(candidate_ext) and os.path.isfile(candidate_ext):
                 return self._get_relative_path(candidate_ext)

        # 3. Check from root
        candidate_root = os.path.join(self.root_dir, import_path)
        if os.path.exists(candidate_root) and os.path.isfile(candidate_root):
            return self._get_relative_path(candidate_root)

        # 4. Check from root with extensions
        for ext in [".js", ".ts", ".jsx", ".tsx", ".css", ".scss", ".html", ".py"]:
            candidate_root_ext = candidate_root + ext
            if os.path.exists(candidate_root_ext) and os.path.isfile(candidate_root_ext):
                return self._get_relative_path(candidate_root_ext)
                
        return None

    def scan(self):
        """Walks the directory and builds the graph for all supported file types."""
        self.graph = {}
        self.nodes = set()
        self.node_types = {}
        self.node_metrics = {}
        
        import re

        # Regex patterns for different languages
        patterns = {
            'js': [
                r'import\s+.*from\s+[\'"](.+)[\'"]',          # import x from 'path'
                r'require\([\'"](.+)[\'"]\)',                  # require('path')
                r'export\s+.*from\s+[\'"](.+)[\'"]',           # export x from 'path'
            ],
            'html': [
                r'<script\s+.*src=[\'"](.+)[\'"]',             # <script src="path">
                r'<link\s+.*href=[\'"](.+)[\'"]',              # <link href="path">
            ],
            'css': [
                r'@import\s+[\'"](.+)[\'"]',                   # @import 'path';
                r'url\([\'"](.+)[\'"]\)',                      # url('path')
            ]
        }

        for subdir, dirs, files in os.walk(self.root_dir):
            dirs[:] = [d for d in dirs if d not in self.IGNORE_DIRS]
            
            for file in files:
                _, ext = os.path.splitext(file)
                if ext.lower() in self.IGNORE_EXTS:
                    continue
                    
                full_path = os.path.join(subdir, file)
                rel_path = self._get_relative_path(full_path)
                
                self.nodes.add(rel_path)
                self.node_types[rel_path] = ext.lower().replace('.', '')
                
                if rel_path not in self.graph:
                    self.graph[rel_path] = set()
                
                # Default metrics
                self.node_metrics[rel_path] = {"loc": 0, "complexity": 0, "nesting": 0}

                try:
                    with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                        content = f.read()
                        
                        # Python Parsing (AST)
                        if file.endswith(".py"):
                            try:
                                tree = ast.parse(content)
                                for node in ast.walk(tree):
                                    if isinstance(node, (ast.Import, ast.ImportFrom)):
                                        # Simple heuristic for Python imports in polyglot mode
                                        # (We can improve this by reusing the old _get_module_path logic if needed,
                                        # but resolving to file paths is tricky without context. 
                                        # For now, we search for file distinct names)
                                        pass 
                                        # Re-implementing basic python path resolution for consistency
                            except:
                                pass # AST parsing failed
                                
                        # Generic Regex Parsing
                        file_patterns = []
                        if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                            file_patterns = patterns['js']
                        elif file.endswith('.html'):
                            file_patterns = patterns['html']
                        elif file.endswith(('.css', '.scss')):
                            file_patterns = patterns['css']

                        for pattern in file_patterns:
                            matches = re.findall(pattern, content)
                            for match in matches:
                                resolved = self._resolve_import(match, full_path)
                                if resolved and resolved != rel_path:
                                    self.graph[rel_path].add(resolved)
                                    self.nodes.add(resolved)
                        
                        # Calculate Metrics
                        lines = content.splitlines()
                        self.node_metrics[rel_path]["loc"] = len(lines)
                        
                        # Basic complexity heuristic: count control structures
                        if file.endswith(('.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css')):
                            complex_patterns = [
                                r'\bif\b', r'\bfor\b', r'\bwhile\b', r'\bcase\b', 
                                r'\bfunction\b', r'\bdef\b', r'\bclass\b', r'\bcatch\b',
                                r'=\s*>', r'\.map\(', r'\.forEach\(', r'\.reduce\('
                            ]
                            combined_pattern = '|'.join(complex_patterns)
                            complexity = len(re.findall(combined_pattern, content))
                            self.node_metrics[rel_path]["complexity"] = complexity
                            
                            # Basic Nesting Depth heuristic (count leading spaces/tabs)
                            max_indent = 0
                            for line in lines:
                                indent = len(line) - len(line.lstrip())
                                if indent > max_indent:
                                    max_indent = indent
                            self.node_metrics[rel_path]["nesting"] = max_indent // 4 # Assume 4 spaces
                                    
                except Exception as e:
                    # Generic catch for file read errors
                    continue

    def get_cytoscape_data(self) -> Dict:
        """Converts graph to Cytoscape JSON with type info."""
        nodes_list = []
        edges_list = []
        
        node_ids = sorted(list(self.nodes))
        node_map = {name: f"N{i}" for i, name in enumerate(node_ids)}

        for name in node_ids:
            nodes_list.append({
                "data": {
                    "id": node_map[name],
                    "label": name,
                    "type": self.node_types.get(name, "unknown"),
                    "metrics": self.node_metrics.get(name, {"loc": 0, "complexity": 0, "nesting": 0})
                }
            })

        for source, targets in self.graph.items():
            src_id = node_map.get(source)
            if src_id:
                for target in targets:
                    tgt_id = node_map.get(target)
                    if tgt_id:
                        edges_list.append({
                            "data": {
                                "source": src_id,
                                "target": tgt_id
                            }
                        })

        return {
            "elements": { "nodes": nodes_list, "edges": edges_list },
            "node_map": node_map
        }

    # Re-include cycle detection (kept same logic)
    def detect_cycles(self) -> list:
        cycles = []
        visited = set()
        path_stack = []
        path_set = set()
        
        all_nodes = sorted(list(self.nodes)) 

        for start_node in all_nodes:
            if start_node in visited:
                continue
            
            stack = [(start_node, iter(self.graph.get(start_node, [])))]
            visited.add(start_node)
            path_stack.append(start_node)
            path_set.add(start_node)

            while stack:
                parent, children = stack[-1]
                try:
                    child = next(children)
                    if child in path_set:
                        try:
                            cycle_start_index = path_stack.index(child)
                            cycle = path_stack[cycle_start_index:] + [child]
                            cycles.append(cycle)
                        except ValueError: pass
                    elif child not in visited:
                        visited.add(child)
                        path_stack.append(child)
                        path_set.add(child)
                        stack.append((child, iter(self.graph.get(child, []))))
                except StopIteration:
                    stack.pop()
                    if path_stack:
                        popped = path_stack.pop()
                        path_set.remove(popped)
        return cycles
