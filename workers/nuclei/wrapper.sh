#!/bin/sh
# Script wrapper pour Nuclei avec des options optimisées

# Utiliser des options optimisées pour la vitesse et la pertinence
nuclei "$@" -silent -stats=false -timeout 20 -rate-limit 300 -concurrency 50
