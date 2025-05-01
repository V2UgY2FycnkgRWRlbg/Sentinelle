FROM projectdiscovery/nuclei:latest

# Mettre à jour les templates
RUN nuclei -update-templates

# Créer un script wrapper pour optimiser les scans
COPY wrapper.sh /wrapper.sh
RUN chmod +x /wrapper.sh

ENTRYPOINT ["/wrapper.sh"]