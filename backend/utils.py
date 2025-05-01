import subprocess
import json

def sanitize_target(target):
    """
    Nettoie l'URL pour éviter les erreurs :
    - Supprime 'http://' ou 'https://'
    - Supprime '/' à la fin
    """
    target = target.strip().rstrip('/')  # Supprime les espaces et '/' en fin d'URL
    if target.startswith("http://") or target.startswith("https://"):
        target = target.split("://")[1]  # Supprime le protocole
    return target

def extract_domain(target):
    """
    Extrait le domaine principal d'une URL
    """
    target = sanitize_target(target)
    # Supprime tout ce qui vient après le premier '/'
    if '/' in target:
        target = target.split('/')[0]
    return target

def run_nmap(target):
    """
    Exécute Nmap pour scanner les ports/services avec des options optimisées pour la vitesse.
    """
    target = sanitize_target(target)  # Nettoie l'URL
    # Options optimisées:
    # -T4: Timing template plus agressif
    # -F: Scan rapide (top 100 ports seulement)
    # --max-retries 1: Limite les tentatives de connexion
    # --host-timeout 30s: Timeout de 30 secondes par hôte
    command = ["docker", "run", "--rm", "sentinelle-nmap_worker", "-T4", "-F", "--max-retries", "1", "--host-timeout", "30s", "-sV", target]
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return f"Nmap scan failed: {e.stderr.strip()}"
    except Exception as e:
        return f"Unexpected error during Nmap scan: {str(e)}"

def run_nuclei(target):
    """
    Exécute Nuclei pour détecter les vulnérabilités avec des options optimisées pour la vitesse.
    """
    print(f"Démarrage du scan Nuclei pour {target}")
    target = sanitize_target(target)  # Nettoie l'URL

    # Ajouter le protocole si nécessaire
    if not target.startswith("http://") and not target.startswith("https://"):
        target = f"https://{target}"

    print(f"URL cible pour Nuclei: {target}")

    # Utiliser le script d'entrée optimisé dans le conteneur
    # Les options sont déjà définies dans le wrapper.sh
    command = ["docker", "run", "--rm", "sentinelle-nuclei_worker", "-u", target, "-no-color"]

    try:
        # Ajouter un timeout plus long pour le processus entier (3 minutes)
        print(f"Exécution de la commande: {' '.join(command)}")
        result = subprocess.run(command, capture_output=True, text=True, check=True, timeout=180)

        stdout = result.stdout.strip()
        print(f"Résultat brut de Nuclei ({len(stdout)} caractères):")
        print(stdout[:500] + "..." if len(stdout) > 500 else stdout)

        # Si aucun résultat n'est trouvé, renvoyer un message explicite
        if not stdout:
            print("Aucune sortie de Nuclei")
            return "Aucune vulnérabilité détectée par Nuclei."

        # Filtrer les lignes d'information et d'avertissement
        filtered_output = []
        for line in stdout.split('\n'):
            if line.strip() and not line.startswith('[INF]') and not line.startswith('[WRN]'):
                filtered_output.append(line)

        if not filtered_output:
            print("Aucune vulnérabilité après filtrage")
            return "Aucune vulnérabilité détectée par Nuclei."

        result_str = '\n'.join(filtered_output)
        print(f"Résultat filtré de Nuclei ({len(result_str)} caractères):")
        print(result_str[:500] + "..." if len(result_str) > 500 else result_str)

        return result_str
    except subprocess.TimeoutExpired:
        print("Timeout du scan Nuclei après 3 minutes")
        return "Le scan Nuclei a été interrompu après 3 minutes (timeout)."
    except subprocess.CalledProcessError as e:
        print(f"Erreur lors de l'exécution de Nuclei: {e.stderr.strip()}")
        return f"Nuclei scan failed: {e.stderr.strip()}"
    except Exception as e:
        print(f"Erreur inattendue lors du scan Nuclei: {str(e)}")
        return f"Unexpected error during Nuclei scan: {str(e)}"

def run_nikto(target):
    """
    Exécute Nikto pour analyser la configuration du serveur web avec des options optimisées pour la vitesse.
    """
    target = sanitize_target(target)  # Nettoie l'URL
    # Options optimisées:
    # -Tuning 123: Limite les tests aux catégories 1, 2 et 3 (les plus importantes)
    # -timeout 10: Timeout de 10 secondes
    # -maxtime 120s: Temps maximum d'exécution de 2 minutes
    command = ["docker", "run", "--rm", "sentinelle-nikto_worker", "-host", target, "-Tuning", "123", "-timeout", "10", "-maxtime", "120s"]
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return f"Nikto scan failed: {e.stderr.strip()}"
    except Exception as e:
        return f"Unexpected error during Nikto scan: {str(e)}"

def run_subfinder(target):
    """
    Exécute Subfinder pour découvrir les sous-domaines.
    """
    domain = extract_domain(target)  # Extrait le domaine principal
    command = ["docker", "run", "--rm", "sentinelle-subfinder_worker", "-d", domain, "-silent", "-json"]
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        # Traiter la sortie JSON
        subdomains = []
        for line in result.stdout.strip().split('\n'):
            if line:
                try:
                    subdomain_data = json.loads(line)
                    subdomains.append(subdomain_data.get('host', ''))
                except json.JSONDecodeError:
                    # Si ce n'est pas du JSON valide, ajouter la ligne brute
                    if line.strip():
                        subdomains.append(line.strip())
        return subdomains
    except subprocess.CalledProcessError as e:
        return [f"Subfinder scan failed: {e.stderr.strip()}"]
    except Exception as e:
        return [f"Unexpected error during Subfinder scan: {str(e)}"]
