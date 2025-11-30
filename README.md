- school project

# Sentinelle - Web Security Platform

Sentinelle is a web security platform that allows you to scan domains to detect vulnerabilities, discover subdomains, and analyze web server configurations.

## Features

* Fast domain scanning
* Subdomain discovery
* Vulnerability detection with Nuclei
* Configuration analysis with Nikto
* Port scanning with Nmap
* Modern interface with dark mode
* Tracking of detected vulnerabilities
* Scan history

## Requirements

* Docker and Docker Compose
* Python 3.8+
* Modern web browser

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-user/sentinelle.git
cd sentinelle
```

### 2. Build the Docker images

```bash
# Build the backend image
docker-compose build backend

# Build the worker images
cd workers/nuclei
docker build -t sentinelle-nuclei_worker .
cd ../nmap
docker build -t sentinelle-nmap_worker .
cd ../nikto
docker build -t sentinelle-nikto_worker .
cd ../subfinder
docker build -t sentinelle-subfinder_worker .
cd ../..
```

## Startup

### 1. Start the Docker containers

```bash
# Start all required Docker containers
docker-compose up -d

# Check that all containers are running
docker-compose ps
```

If you prefer to start the services individually:

```bash
# Start only the backend
docker-compose up -d backend

# Start or restart a specific container
docker restart sentinelle-backend-1
```

### 2. Start the frontend

```bash
# Start a simple HTTP server for the frontend
cd frontend
python3 -m http.server 8080
```

### 3. Access the application

Open your browser and go to:

```
http://localhost:8080
```

## Usage

### Scan a domain

1. Go to the "New Scan" tab
2. Enter the target domain (e.g., example.com)
3. Choose between a direct scan or subdomain discovery
4. If you choose subdomain discovery, select up to 3 subdomains to scan
5. Wait for the scan to finish
6. View the results in the modal window

### View vulnerabilities

1. Go to the "Vulnerabilities" tab
2. Browse the detected vulnerabilities, sorted by severity
3. Use filters to refine your search

### View the scan history

1. Go to the "History" tab
2. View previous scans
3. Click "View results" to display scan details

## Architecture

The project is composed of several components:

* **Frontend**: HTML/CSS/JavaScript user interface
* **Backend**: FastAPI API that orchestrates scans
* **Workers**: Docker containers specialized for each scanning tool

  * Nuclei: Vulnerability detection
  * Nmap: Port scanning
  * Nikto: Web configuration analysis
  * Subfinder: Subdomain discovery

## Project structure

```
sentinelle/
├── backend/                # FastAPI backend code
│   ├── main.py            # API entry point
│   └── utils.py           # Utility functions for scans
├── frontend/               # User interface
│   ├── index.html         # Main page
│   ├── style.css          # Main CSS styles
│   ├── vuln-styles.css    # Vulnerability-related styles
│   └── script.js          # JavaScript code
├── workers/                # Docker containers for scanning tools
│   ├── nmap/              # Worker for Nmap
│   │   └── Dockerfile
│   ├── nuclei/            # Worker for Nuclei
│   │   ├── Dockerfile
│   │   └── wrapper.sh
│   ├── nikto/             # Worker for Nikto
│   │   └── Dockerfile
│   └── subfinder/         # Worker for Subfinder
│       └── Dockerfile
├── docker-compose.yml      # Docker Compose configuration
└── README.md               # Project documentation
```

## Managing Docker containers

### Check container status

```bash
# Show all running containers
docker ps

# Show all containers (including stopped ones)
docker ps -a
```

### Manage containers

```bash
# Stop all containers
docker-compose down

# Restart a specific container
docker restart sentinelle-backend-1

# View container logs in real time
docker logs -f sentinelle-backend-1
```

### Rebuild images after modifications

If you modify the backend or worker code, you will need to rebuild the images:

```bash
# Rebuild the backend image
docker-compose build backend

# Rebuild a specific worker image
cd workers/nuclei
docker build -t sentinelle-nuclei_worker .
```

## Troubleshooting

### Backend does not start

Check the Docker logs:

```bash
docker-compose logs backend
```

### Scans fail

Check that the worker Docker images are correctly built:

```bash
docker images | grep sentinelle
```

### Connection issues with the backend

Verify that the backend is accessible:

```bash
curl http://localhost:8000
```

### Issues with workers

Check that you can run workers manually:

```bash
# Test the Nuclei worker
docker run --rm sentinelle-nuclei_worker -u https://example.com -no-color

# Test the Nmap worker
docker run --rm sentinelle-nmap_worker example.com
```

## Customization

### Change the frontend port

Modify the HTTP server startup command:

```bash
python3 -m http.server <port>
```

### Change the backend port

Edit the `docker-compose.yml` file and change the exposed port for the backend service.

## Licence

This project is under MIT License
