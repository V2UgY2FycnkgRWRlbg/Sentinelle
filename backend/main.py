from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
from pydantic import BaseModel, Field
from typing import List, Optional
from utils import run_nmap, run_nuclei, run_nikto, run_subfinder

app = FastAPI()

# CORS pour éviter les erreurs 405 et permettre les requêtes du frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Autorise toutes les origines (met ici ton vrai domaine en production)
    allow_credentials=True,
    allow_methods=["POST", "GET"],  # Autorise POST et GET
    allow_headers=["*"],
)

# Simulated in-memory task storage
tasks = {}

# Input validation schemas
class ScanRequest(BaseModel):
    target: str

class SubdomainScanRequest(BaseModel):
    target: str

class FullScanRequest(BaseModel):
    subdomains: List[str] = Field(..., max_items=3)  # Maximum 3 sous-domaines


@app.post("/scan/subdomains/")
def start_subdomain_scan(request: SubdomainScanRequest, background_tasks: BackgroundTasks):
    """
    Start a subdomain discovery scan for a given target.
    """
    target = request.target
    task_id = str(uuid4())
    # Store the initial task status
    tasks[task_id] = {"status": "pending", "result": None}
    # Add the subdomain scan to background tasks
    background_tasks.add_task(run_subdomain_scan, task_id, target)
    return {"task_id": task_id, "status": "started"}

@app.post("/scan/full/")
def start_full_scan(request: FullScanRequest, background_tasks: BackgroundTasks):
    """
    Start a full scan process for selected subdomains.
    """
    subdomains = request.subdomains
    if len(subdomains) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 subdomains allowed")

    task_id = str(uuid4())
    # Store the initial task status
    tasks[task_id] = {"status": "pending", "result": None}
    # Add the full scan to background tasks
    background_tasks.add_task(run_full_scan, task_id, subdomains)
    return {"task_id": task_id, "status": "started"}

@app.post("/scan/")
def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    """
    Start a scan process for a given target (legacy endpoint).
    """
    target = request.target
    task_id = str(uuid4())
    # Store the initial task status
    tasks[task_id] = {"status": "pending", "result": None}
    # Add the scan to background tasks
    background_tasks.add_task(run_scan, task_id, target)
    return {"task_id": task_id, "status": "started"}


def run_subdomain_scan(task_id: str, target: str):
    """
    Run Subfinder to discover subdomains.
    """
    try:
        # Run Subfinder
        subdomains = run_subfinder(target)

        # Store results
        tasks[task_id] = {
            "status": "completed",
            "result": {
                "subdomains": subdomains
            }
        }
    except Exception as e:
        # Handle errors during scan
        tasks[task_id] = {"status": "error", "error": str(e)}

def run_full_scan(task_id: str, subdomains: List[str]):
    """
    Orchestrate Nmap, Nuclei, and Nikto scans for multiple subdomains with progress updates.
    """
    try:
        results = {}
        total_subdomains = len(subdomains)

        for i, subdomain in enumerate(subdomains):
            # Mettre à jour le statut pour indiquer le sous-domaine en cours
            tasks[task_id] = {
                "status": "running",
                "progress": f"Analyse du sous-domaine {i+1}/{total_subdomains}: {subdomain}",
                "result": results
            }

            # Mettre à jour le statut pour indiquer que Nmap est en cours
            tasks[task_id] = {
                "status": "running",
                "progress": f"Sous-domaine {i+1}/{total_subdomains}: {subdomain} - Exécution de Nmap (1/3)...",
                "result": results
            }

            # Run Nmap
            nmap_result = run_nmap(subdomain)

            # Mettre à jour le statut pour indiquer que Nuclei est en cours
            tasks[task_id] = {
                "status": "running",
                "progress": f"Sous-domaine {i+1}/{total_subdomains}: {subdomain} - Exécution de Nuclei (2/3)...",
                "result": results
            }

            # Run Nuclei
            nuclei_result = run_nuclei(subdomain)

            # Mettre à jour le statut pour indiquer que Nikto est en cours
            tasks[task_id] = {
                "status": "running",
                "progress": f"Sous-domaine {i+1}/{total_subdomains}: {subdomain} - Exécution de Nikto (3/3)...",
                "result": results
            }

            # Run Nikto
            nikto_result = run_nikto(subdomain)

            # Store results for this subdomain
            results[subdomain] = {
                "nmap": nmap_result,
                "nuclei": nuclei_result,
                "nikto": nikto_result
            }

        # Aggregate results
        tasks[task_id] = {
            "status": "completed",
            "progress": "Scan terminé !",
            "result": results
        }
    except Exception as e:
        # Handle errors during scans
        tasks[task_id] = {"status": "error", "error": str(e)}

def run_scan(task_id: str, target: str):
    """
    Orchestrate Nmap, Nuclei, and Nikto scans (legacy function) with progress updates.
    """
    try:
        # Mettre à jour le statut pour indiquer que Nmap est en cours
        tasks[task_id] = {
            "status": "running",
            "progress": "Exécution de Nmap (1/3)...",
            "result": None
        }

        # Run Nmap
        nmap_result = run_nmap(target)

        # Mettre à jour le statut pour indiquer que Nuclei est en cours
        tasks[task_id] = {
            "status": "running",
            "progress": "Exécution de Nuclei (2/3)...",
            "result": {
                "nmap": nmap_result
            }
        }

        # Run Nuclei using the target
        nuclei_result = run_nuclei(target)

        # Mettre à jour le statut pour indiquer que Nikto est en cours
        tasks[task_id] = {
            "status": "running",
            "progress": "Exécution de Nikto (3/3)...",
            "result": {
                "nmap": nmap_result,
                "nuclei": nuclei_result
            }
        }

        # Run Nikto
        nikto_result = run_nikto(target)

        # Aggregate results
        tasks[task_id] = {
            "status": "completed",
            "progress": "Scan terminé !",
            "result": {
                "nmap": nmap_result,
                "nuclei": nuclei_result,
                "nikto": nikto_result
            }
        }
    except Exception as e:
        # Handle errors during scans
        tasks[task_id] = {"status": "error", "error": str(e)}


@app.get("/results/{task_id}")
def get_results(task_id: str):
    """
    Fetch the results of a scan by task ID.
    """
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.get("/")
def root():
    """
    Default endpoint to check if the API is running.
    """
    return {"message": "Pentest API is running"}
