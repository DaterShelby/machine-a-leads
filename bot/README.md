# Machine à Leads - Bot de Génération de Leads Piscinistes

Bot Python pour générer des leads de qualité destinés aux piscinistes, en scrapant les données DVF (Demandes de Valeurs Foncières) et en filtrant les propriétés correspondant aux critères spécifiques.

## Caractéristiques

- **Scraping DVF**: Récupération automatique des données de ventes immobilières via l'API gratuite
- **Filtrage intelligent**: Prix 500K-1.2M€, terrain > 200m², maisons individuelles
- **Enrichissement GPS**: Géolocalisation automatique via l'API adresse.data.gouv.fr
- **Images satellites**: Téléchargement des photos aériennes (Google Maps ou Mapbox)
- **Génération IA**: Création de visualisations avant/après piscine (Stability AI)
- **Emails personnalisés**: Envoi de campagnes ciblées via Brevo avec HTML optimisé
- **Base SQLite**: Stockage structuré avec support complet CRUD
- **Pipeline async**: Traitement parallèle haute performance avec asyncio
- **Interface CLI riche**: Affichage coloré avec barre de progression

## Installation

### Prérequis
- Python 3.10+
- pip

### Setup

```bash
# Cloner/télécharger le projet
cd /sessions/confident-lucid-brahmagupta/build-deploy/bot

# Installer les dépendances
pip install -r requirements.txt

# Copier la configuration d'exemple
cp .env.example .env
```

### Configuration (.env)

```bash
# Clés API optionnelles (commenter pour désactiver)
GOOGLE_MAPS_API_KEY=your_key_here
MAPBOX_API_KEY=your_key_here
STABILITY_AI_API_KEY=your_key_here
BREVO_API_KEY=your_key_here

# Email sender
SENDER_EMAIL=contact@machinealeads.fr
SENDER_NAME=Machine à Leads

# Logging
LOG_LEVEL=INFO
```

**Important**: Le mode `--mode=scan` fonctionne sans aucune clé API. Les autres étapes (images, emails) sont optionnelles.

## Usage

### Mode Scan (Scraping DVF uniquement)

```bash
# Scanner des codes postaux spécifiques
python bot.py --mode=scan --codes 75001 75002 92100

# Utiliser les codes postaux configurés dans config.py
python bot.py --mode=scan

# Scanner un département entier (dans le code)
python bot.py --mode=scan
```

**Critères de filtrage appliqués**:
- Prix: 500,000€ - 1,200,000€
- Surface terrain: > 200m²
- Type: Maison individuelle
- Nature: Vente

### Mode Test (Pipeline limité)

```bash
# Traite max 5 propriétés en base de données
python bot.py --mode=test
```

Utile pour tester le pipeline complet sans traiter toutes les propriétés:
1. Télécharge images satellites (si clé API)
2. Génère images IA (si clé API)
3. Envoie emails (si clé API)

### Mode Run (Pipeline complet)

```bash
# Exécute le pipeline complet
python bot.py --mode=run
```

1. Scrape les données DVF
2. Télécharge les images satellites
3. Génère les images IA
4. Envoie les campagnes emails

### Afficher les statistiques

```bash
python bot.py --stats
```

Affiche:
- Total de propriétés
- Nouvelles propriétés
- Emails envoyés
- Prix moyen
- Villes uniques

## Structure des fichiers

```
bot/
├── bot.py                  # Script principal CLI
├── config.py               # Configuration & constantes  
├── requirements.txt        # Dépendances Python
├── .env.example            # Template des clés API
├── modules/
│   ├── __init__.py
│   ├── scraper.py          # Collecte données DVF
│   ├── satellite.py        # Téléchargement images satellites
│   ├── image_gen.py        # Génération IA avant/après
│   ├── mailer.py           # Composition & envoi emails
│   └── database.py         # Base SQLite + requêtes
├── templates/
│   └── email_template.html # Template email HTML
└── data/
    ├── leads.db            # Base de données SQLite
    ├── images/             # Images satellites et IA
    └── email_drafts/       # Brouillons d'emails (si pas de clé)
```

## Architecture

### Modules

#### `scraper.py`
- Scrape l'API DVF: `https://api.cquest.org/dvf`
- Filtre par prix, surface, type local
- Enrichit avec coordonnées GPS via `api-adresse.data.gouv.fr`
- Rate limiting: 0.5s entre requêtes
- Support async/await pour performance

#### `database.py`
- SQLite avec 3 tables:
  - `properties`: Propriétés scrapées
  - `emails`: Suivi des envois
  - `pipeline_jobs`: Historique des exécutions
- CRUD complet + export CSV
- Statistiques agrégées

#### `satellite.py`
- Fallback: Google Maps → Mapbox
- Images 640x640px, zoom 19, satellite view
- Sauvegarde en `data/images/{id}_before.jpg`
- Gestion gracieuse si clés API manquantes

#### `image_gen.py`
- API Stability AI pour inpainting
- Prompt optimisé: "swimming pool, turquoise water, stone decking..."
- Sauvegarde en `data/images/{id}_after.jpg`
- Logs + skip si pas de clé

#### `mailer.py`
- HTML template optimisé avec images
- Envoi via Brevo API v3 SMTP
- Sauvegarde en draft local si pas de clé
- Support batch processing

### Base de données

**properties**:
```sql
id, address, city, postal_code, lat, lon, price, land_surface_m2,
building_surface_m2, mutation_date, has_pool, satellite_image_path,
ai_image_path, status, created_at, dvf_id
```

**emails**:
```sql
id, property_id, sent_at, opened_at, clicked_at, replied_at, follow_up_count
```

**pipeline_jobs**:
```sql
id, job_type, status, started_at, completed_at, properties_processed, errors, log_summary
```

## Flux de données

```
DVF API (gratuite)
    ↓
Scraper → Filter (prix, surface, type)
    ↓
Geocoding (adresse.data.gouv.fr - gratuite)
    ↓
Database (SQLite)
    ↓
Satellite Images (Google Maps / Mapbox - payant)
    ↓
AI Generation (Stability AI - payant)
    ↓
Email Campaign (Brevo SMTP - gratuit)
    ↓
Leads ✓
```

## Codes de statut propriétés

- `new`: Nouvelle propriété scrapée, pas encore traitée
- `processed`: Propriété traitée par le pipeline
- `emailed`: Email envoyé au prospect
- `contacted`: Réponse reçue
- `error`: Erreur lors du traitement

## API External

### DVF (Gratuite)
```
https://api.cquest.org/dvf?code_postal=75001&nature_mutation=Vente&type_local=Maison
```

### Adresse (Gratuite)
```
https://api-adresse.data.gouv.fr/search?q=123%20Rue%20de%20Paris
```

### Google Maps Static (Payant)
- $2 par 1000 requêtes
- Size: 640x640, zoom 19, satellite

### Mapbox (Payant)
- $0.50 par 1000 requêtes
- Alternative à Google Maps

### Stability AI (Payant)
- $0.03 per 1M tokens
- Inpainting: ajouter piscine à image satellite

### Brevo SMTP (Gratuit jusqu'à 300/jour)
- API v3 SMTP
- $20/mois pour illimité

## Développement

### Run local tests

```bash
# Tester le scraper
python -c "
import asyncio
from modules.scraper import Scraper

async def test():
    scraper = Scraper()
    props = await scraper.scan_postal_codes(['75001'], 500000, 1200000, 200)
    print(f'{len(props)} propriétés trouvées')

asyncio.run(test())
"

# Tester la base de données
python -c "
from modules.database import Database
from pathlib import Path

db = Database(Path('data/leads.db'))
stats = db.get_statistics()
print(f'Total: {stats[\"total_properties\"]} propriétés')
"
```

### Ajouter des propriétés de test

```bash
python << 'EOF'
import sqlite3

conn = sqlite3.connect('data/leads.db')
cursor = conn.cursor()

cursor.execute("""INSERT INTO properties
    (address, city, postal_code, price, land_surface_m2, lat, lon)
    VALUES (?, ?, ?, ?, ?, ?, ?)""",
    ("123 Rue Test", "Paris", "75001", 750000, 500, 48.8566, 2.3522)
)

conn.commit()
conn.close()
print("✓ Propriété test ajoutée")
EOF
```

## Performance

- **Scraping**: ~10 propriétés/min (rate limit 0.5s)
- **Géolocalisation**: ~20 adresses/min (rate limit 0.3s)
- **Images satellites**: ~1 image/sec (API delay)
- **Génération IA**: ~30s/image (Stability AI inference)
- **Emails**: ~2/sec (Brevo batch)

## Troubleshooting

### DVF API error 502
L'API peut être temporairement indisponible. Relancer le bot.

### Image satellite manquante
- Clé API Google Maps/Mapbox manquante
- Vérifier les coordonnées GPS (lat, lon)
- Consulter logs pour détails

### Email sauvegardé en draft
- Clé Brevo manquante
- Vérifier `.env` et relancer

### Timeout asyncio
Augmenter `REQUEST_TIMEOUT` dans `config.py`

## Roadmap

- [ ] Support captcha/proxy pour DVF si rate limit
- [ ] Stockage images sur S3/Cloudinary
- [ ] Webhooks pour intégrations tierces
- [ ] Dashboard web pour monitoring
- [ ] SMS fallback si email échoue
- [ ] API REST pour créer/lister leads
- [ ] Déduplication smart (géographique + prix)
- [ ] ML pour score de qualité lead

## License

Propriétaire - Machine à Leads

## Contact

Pour questions/support: contact@machinealeads.fr
