"""
Configuration et constantes pour le bot Machine à Leads.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Répertoires
BASE_DIR = Path(__file__).resolve().parent
MODULES_DIR = BASE_DIR / "modules"
TEMPLATES_DIR = BASE_DIR / "templates"
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "leads.db"
IMAGES_DIR = DATA_DIR / "images"

# Créer les répertoires s'ils n'existent pas
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# Critères de filtrage
PRICE_MIN = 500_000  # euros
PRICE_MAX = 1_200_000  # euros
LAND_MIN_M2 = 200  # m²

# Départements à scanner (vides = scanner tous)
DEPARTMENTS_TO_SCAN = [
    # Laisser vide pour scanner toute la France
    # Exemples: ['75', '92', '78'] pour Île-de-France
]

# APIs externes
DVF_API_BASE = "https://api.cquest.org/dvf"
ADDRESS_API_BASE = "https://api-adresse.data.gouv.fr"
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
MAPBOX_API_KEY = os.getenv("MAPBOX_API_KEY", "")
STABILITY_AI_API_KEY = os.getenv("STABILITY_AI_API_KEY", "")
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")

# Rate limiting
DVF_REQUEST_DELAY = 0.5  # secondes entre chaque requête DVF
ADDRESS_REQUEST_DELAY = 0.3  # secondes pour adresse.data.gouv.fr
SATELLITE_REQUEST_DELAY = 1.0  # secondes pour API images satellites

# Configuration asyncio
BATCH_SIZE = 10  # nombre de propriétés à traiter en parallèle
REQUEST_TIMEOUT = 30  # secondes

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Email
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "contact@machinealeads.fr")
SENDER_NAME = os.getenv("SENDER_NAME", "Machine à Leads")

# Images satellites
SATELLITE_IMAGE_SIZE = 640
SATELLITE_IMAGE_ZOOM = 19
SATELLITE_IMAGE_TYPE = "satellite"

# Génération IA
IMAGE_GEN_PROMPT = """Aerial satellite view of a backyard with a modern rectangular swimming pool
with turquoise water, stone decking, realistic shadows, photorealistic, 4K"""
IMAGE_GEN_NEGATIVE_PROMPT = "distorted, unrealistic, cartoon, blurry, low quality"
IMAGE_GEN_STEPS = 20
IMAGE_GEN_CFG = 7.5
