
Projet scolaire

# Sentinelle - Plateforme de Sécurité Web

Sentinelle est une plateforme de sécurité web qui permet de scanner des domaines pour détecter des vulnérabilités, découvrir des sous-domaines et analyser la configuration des serveurs web.

## Fonctionnalités

- Scan rapide de domaines
- Découverte de sous-domaines
- Détection de vulnérabilités avec Nuclei
- Analyse de configuration avec Nikto
- Scan de ports avec Nmap
- Interface moderne avec mode sombre
- Suivi des vulnérabilités détectées
- Historique des scans

## Prérequis

- Docker et Docker Compose
- Python 3.8+
- Navigateur web moderne

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-utilisateur/sentinelle.git
cd sentinelle
```

### 2. Construire les images Docker

```bash
# Construire l'image du backend
docker-compose build backend

# Construire les images des workers
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

## Démarrage

### 1. Lancer les conteneurs Docker

```bash
# Démarrer tous les conteneurs Docker nécessaires
docker-compose up -d

# Vérifier que tous les conteneurs sont en cours d'exécution
docker-compose ps
```

Si vous préférez démarrer les services individuellement :

```bash
# Démarrer uniquement le backend
docker-compose up -d backend

# Démarrer ou redémarrer un conteneur spécifique
docker restart sentinelle-backend-1
```

### 2. Lancer le frontend

```bash
# Démarrer un serveur HTTP simple pour le frontend
cd frontend
python3 -m http.server 8080
```

### 3. Accéder à l'application

Ouvrez votre navigateur et accédez à l'URL suivante :
```
http://localhost:8080
```

## Utilisation

### Scanner un domaine

1. Accédez à l'onglet "Nouveau scan"
2. Entrez le domaine cible (ex: example.com)
3. Choisissez entre un scan direct ou une découverte de sous-domaines
4. Si vous choisissez la découverte de sous-domaines, sélectionnez jusqu'à 3 sous-domaines à scanner
5. Attendez que le scan se termine
6. Consultez les résultats dans la fenêtre modale

### Consulter les vulnérabilités

1. Accédez à l'onglet "Vulnérabilités"
2. Parcourez les vulnérabilités détectées, classées par sévérité
3. Utilisez les filtres pour affiner votre recherche

### Consulter l'historique

1. Accédez à l'onglet "Historique"
2. Consultez les scans précédents
3. Cliquez sur "Voir les résultats" pour afficher les détails d'un scan

## Architecture

Le projet est composé de plusieurs composants :

- **Frontend** : Interface utilisateur en HTML/CSS/JavaScript
- **Backend** : API FastAPI qui orchestre les scans
- **Workers** : Conteneurs Docker spécialisés pour chaque outil de scan
  - Nuclei : Détection de vulnérabilités
  - Nmap : Scan de ports
  - Nikto : Analyse de configuration web
  - Subfinder : Découverte de sous-domaines

## Structure du projet

```
sentinelle/
├── backend/                # Code du backend FastAPI
│   ├── main.py            # Point d'entrée de l'API
│   └── utils.py           # Fonctions utilitaires pour les scans
├── frontend/               # Interface utilisateur
│   ├── index.html         # Page principale
│   ├── style.css          # Styles CSS principaux
│   ├── vuln-styles.css    # Styles pour les vulnérabilités
│   └── script.js          # Code JavaScript
├── workers/                # Conteneurs Docker pour les outils
│   ├── nmap/              # Worker pour Nmap
│   │   └── Dockerfile
│   ├── nuclei/            # Worker pour Nuclei
│   │   ├── Dockerfile
│   │   └── wrapper.sh
│   ├── nikto/             # Worker pour Nikto
│   │   └── Dockerfile
│   └── subfinder/         # Worker pour Subfinder
│       └── Dockerfile
├── docker-compose.yml      # Configuration Docker Compose
└── README.md               # Documentation du projet
```

## Gestion des conteneurs Docker

### Vérifier l'état des conteneurs

```bash
# Afficher tous les conteneurs en cours d'exécution
docker ps

# Afficher tous les conteneurs (y compris ceux arrêtés)
docker ps -a
```

### Gérer les conteneurs

```bash
# Arrêter tous les conteneurs
docker-compose down

# Redémarrer un conteneur spécifique
docker restart sentinelle-backend-1

# Voir les logs d'un conteneur en temps réel
docker logs -f sentinelle-backend-1
```

### Reconstruire les images après modification

Si vous modifiez le code du backend ou des workers, vous devrez reconstruire les images :

```bash
# Reconstruire l'image du backend
docker-compose build backend

# Reconstruire une image worker spécifique
cd workers/nuclei
docker build -t sentinelle-nuclei_worker .
```

## Dépannage

### Le backend ne démarre pas

Vérifiez les logs Docker :
```bash
docker-compose logs backend
```

### Les scans échouent

Vérifiez que les images Docker des workers sont correctement construites :
```bash
docker images | grep sentinelle
```

### Problèmes de connexion au backend

Vérifiez que le backend est accessible :
```bash
curl http://localhost:8000
```

### Problèmes avec les workers

Vérifiez que vous pouvez exécuter les workers manuellement :
```bash
# Tester le worker Nuclei
docker run --rm sentinelle-nuclei_worker -u https://example.com -no-color

# Tester le worker Nmap
docker run --rm sentinelle-nmap_worker example.com
```

## Personnalisation

### Changer le port du frontend

Modifiez la commande de démarrage du serveur HTTP :
```bash
python3 -m http.server <port>
```

### Changer le port du backend

Modifiez le fichier `docker-compose.yml` et changez le port exposé pour le service backend.

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.
