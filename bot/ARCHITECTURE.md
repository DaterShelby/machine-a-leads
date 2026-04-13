# Architecture - Machine à Leads

## Vue d'ensemble

Machine à Leads est un système de génération de leads basé sur le scraping de l'API gratuite DVF, filtrant les propriétés résidentielles, enrichissant les données avec géolocalisation, images satellites, génération IA et campagnes email personnalisées.

## Flux global

```
┌─────────────────────────────────────────────────────────────┐
│                    PIPELINE D'EXÉCUTION                      │
└─────────────────────────────────────────────────────────────┘

1. SCRAPING DVF (Gratuit)
   └─> API: https://api.cquest.org/dvf
   └─> Filtres: Prix, Surface, Type local
   └─> Rate limit: 0.5s

2. GÉOLOCALISATION (Gratuit)
   └─> API: api-adresse.data.gouv.fr
   └─> Enrichit: lat/lon
   └─> Rate limit: 0.3s

3. STOCKAGE
   └─> SQLite: leads.db
   └─> Tables: properties, emails, pipeline_jobs

4. IMAGES SATELLITES (Payant - optionnel)
   └─> Google Maps ou Mapbox
   └─> 640x640px, satellite view, zoom 19
   └─> Sauvegarde: data/images/{id}_before.jpg

5. GÉNÉRATION IA (Payant - optionnel)
   └─> Stability AI: Image inpainting
   └─> Ajoute piscine à image satellite
   └─> Sauvegarde: data/images/{id}_after.jpg

6. CAMPAGNE EMAIL (Gratuit ou payant)
   └─> Brevo SMTP v3
   └─> HTML personnalisé avec images
   └─> Tracking: sent_at, opened_at, clicked_at

7. ANALYTICS
   └─> Pipeline jobs: historique exécutions
   └─> Stats: total, prix moyen, villes
```

## Structure des modules

### `scraper.py` - Collecte de données

```python
class Scraper:
    - scan_postal_codes()       # Scanner liste CP
    - scan_department()         # Scanner dept entier
    - scan_all_france()         # Scanner France (long)
    - scrape_postal_code()      # Requête DVF unique
    - enrich_coordinates()      # Géolocalisation
```

**Pattern async**:
```python
async with aiohttp.ClientSession() as session:
    tasks = [scrape_postal_code(cp, ...) for cp in codes]
    results = await asyncio.gather(*tasks)
```

**Filtres appliqués**:
```
- valeur_fonciere: 500_000 - 1_200_000 €
- surface_terrain: > 200 m²
- type_local: Maison
- nature_mutation: Vente
```

### `database.py` - Persistance

```python
class Database:
    - add_property()            # Insérer propriété
    - get_property()            # Récupérer par ID
    - get_all_properties()      # Lister tous
    - update_property_status()  # Mettre à jour statut
    - update_satellite_image()  # Lier image satellite
    - update_ai_image()         # Lier image IA
    - add_email()               # Tracker envoi email
    - create_pipeline_job()     # Créer job
    - export_csv()              # Exporter CSV
    - get_statistics()          # Stats agrégées
```

**Schéma SQLite**:
```sql
properties (
    id, address, city, postal_code, lat, lon, price,
    land_surface_m2, building_surface_m2, mutation_date,
    has_pool, satellite_image_path, ai_image_path,
    status, created_at, dvf_id
)

emails (
    id, property_id, sent_at, opened_at,
    clicked_at, replied_at, follow_up_count
)

pipeline_jobs (
    id, job_type, status, started_at, completed_at,
    properties_processed, errors, log_summary
)
```

### `satellite.py` - Images satellites

```python
class SatelliteModule:
    - fetch_satellite_image()   # Télécharger image
    - fetch_from_google_maps()  # Provider Google
    - fetch_from_mapbox()       # Provider Mapbox (fallback)
    - fetch_batch()             # Batch processing
```

**Fallback strategy**:
1. Essayer Google Maps (clé API configurée)
2. Fallback sur Mapbox (clé API configurée)
3. Log warning et skip (aucune clé)

**Ne crash jamais** - gestion gracieuse des erreurs

### `image_gen.py` - Génération IA

```python
class ImageGenModule:
    - generate_pool_image()     # Générer image piscine
    - generate_batch()          # Batch processing
```

**Prompt optimisé**:
```
"Aerial satellite view of a backyard with a modern rectangular
swimming pool with turquoise water, stone decking, realistic shadows,
photorealistic, 4K"
```

**Négatif**:
```
"distorted, unrealistic, cartoon, blurry, low quality"
```

**API**: Stability AI v3 Image-to-Image (inpainting)

### `mailer.py` - Campagne email

```python
class MailerModule:
    - send_email()              # Envoyer email unique
    - send_batch()              # Batch email
    - generate_email_html()     # Générer HTML
    - _save_draft_email()       # Sauvegarder draft local
```

**Template HTML**:
- Header branded (blue #0099ff)
- Info propriété (adresse, ville)
- Images before/after côte à côte
- Bénéfices piscine (bulleted list)
- CTA "Je veux un devis gratuit"
- RGPD unsubscribe link
- Responsive design

**Fallback**: Si pas de clé Brevo, sauvegarder en HTML local

### `bot.py` - CLI principal

```python
class MachineALeads:
    - mode_scan()               # DVF scraping only
    - mode_test()               # Traiter 5 propriétés
    - mode_run()                # Full pipeline
```

**CLI Arguments**:
```bash
--mode {scan|test|run}          # Mode d'exécution
--codes 75001 75002 ...         # Codes postaux spécifiques
--stats                         # Afficher stats et quitter
```

## Intégrations API externes

### DVF (Gratuit)
```
Endpoint: https://api.cquest.org/dvf
Params: code_postal, nature_mutation, type_local
Auth: Aucune
Limite: Non spécifiée (respecter 0.5s rate limit)
```

### Adresse.data.gouv.fr (Gratuit)
```
Endpoint: https://api-adresse.data.gouv.fr/search
Params: q (adresse), limit
Auth: Aucune
Limite: Non spécifiée
```

### Google Maps Static (Payant)
```
Endpoint: https://maps.googleapis.com/maps/api/staticmap
Params: center, zoom, size, maptype (satellite)
Auth: API key
Coût: $2 / 1000 requêtes
```

### Mapbox Static (Payant)
```
Endpoint: https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static
Params: lon, lat, zoom
Auth: access_token
Coût: $0.50 / 1000 requêtes
```

### Stability AI (Payant)
```
Endpoint: https://api.stability.ai/v1/generation/{engine_id}/image-to-image
Method: POST
Auth: Bearer token
Coût: $0.03 / 1M tokens (peu utilisé)
Engine: stable-diffusion-xl-1024-v1-0
```

### Brevo SMTP (Gratuit/Payant)
```
Endpoint: https://api.brevo.com/v3/smtp/email
Method: POST
Auth: api-key header
Gratuit: 300 emails/jour
Payant: $20/mois illimité
```

## Gestion asynchrone

Pattern async/await avec `asyncio`:

```python
async def process():
    async with aiohttp.ClientSession() as session:
        # Batch de 10 tâches parallèles
        tasks = [fetch_data(item, session) for item in items]
        results = await asyncio.gather(*tasks)
        
        # Traiter résultats
        for result in results:
            # ...
            await asyncio.sleep(RATE_LIMIT)
```

**Batch size**: 10 (configurable)
**Timeouts**: 30s par requête

## Gestion d'erreurs

### Stratégie resilience

1. **Timeout**: Log warning, skip item, continue
2. **API 5xx**: Retry automatique ou skip gracieux
3. **API rate limit**: Respecter headers rate-limit
4. **Missing data**: Enrichir partiellement ou skip
5. **DB conflict**: Ignorer si déjà existant (DVF_ID unique)

### Logging

- **DEBUG**: Détails complets (JSON responses)
- **INFO**: Progress et résumés
- **WARNING**: Erreurs non critiques (API down, missing key)
- **ERROR**: Erreurs critiques (DB fail, crash)

Output: Console colorée (rich library)

## Performance

| Opération | Débit | Limitation |
|-----------|-------|-----------|
| DVF scraping | 10/min | 0.5s rate limit |
| Géolocalisation | 20/min | 0.3s rate limit |
| Images satellites | 1/sec | 1.0s + upload |
| Génération IA | 2/min | 30s inference |
| Emails Brevo | 2/sec | API backend |

**Optimisations**:
- Async/await pour IO non-bloquant
- Batch processing (10 items en parallèle)
- SQLite index sur postal_code, price, status
- Lazy loading images (ne télécharger que si needed)

## Configuration

### Variables d'environnement (.env)

```env
# APIs (optionnelles)
GOOGLE_MAPS_API_KEY=...
MAPBOX_API_KEY=...
STABILITY_AI_API_KEY=...
BREVO_API_KEY=...

# Email
SENDER_EMAIL=contact@machinealeads.fr
SENDER_NAME=Machine à Leads

# Logging
LOG_LEVEL=INFO

# Filtres (optionnel)
DEPARTMENTS=75,92,78
```

### Constantes (config.py)

```python
PRICE_MIN = 500_000
PRICE_MAX = 1_200_000
LAND_MIN_M2 = 200
BATCH_SIZE = 10
DVF_REQUEST_DELAY = 0.5
REQUEST_TIMEOUT = 30
```

## Fichiers importants

```
/sessions/confident-lucid-brahmagupta/build-deploy/bot/
├── bot.py                      # Entrypoint CLI
├── config.py                   # Configuration centralisée
├── requirements.txt            # Dépendances Python
├── .env.example               # Template variables env
├── README.md                   # Documentation utilisateur
├── ARCHITECTURE.md            # Ce fichier
├── quickstart.sh              # Script setup
├── test_modules.py            # Tests unitaires
├── modules/
│   ├── __init__.py
│   ├── scraper.py             # DVF scraping
│   ├── database.py            # SQLite
│   ├── satellite.py           # Google Maps / Mapbox
│   ├── image_gen.py           # Stability AI
│   └── mailer.py              # Brevo SMTP
├── templates/
│   └── email_template.html    # Email HTML
└── data/
    ├── leads.db               # Base données
    ├── images/                # Satellite + IA images
    └── email_drafts/          # Brouillons emails
```

## Exemple de flux complet

### Inputs
```python
postal_codes = ["75001", "75002", "92100"]
price_min = 500_000
price_max = 1_200_000
land_min = 200
```

### Process
1. **Scraper.scan_postal_codes()**
   - Appel DVF API pour chaque CP
   - Filtre par prix/surface
   - Retourne 10 propriétés

2. **Scraper.enrich_coordinates()**
   - Géolocalise chaque adresse
   - Ajoute lat/lon
   - Rate limit: 0.3s/requête

3. **Database.add_property()**
   - Insère dans SQLite
   - Déduplique par dvf_id
   - Crée index

4. **SatelliteModule.fetch_batch()**
   - Télécharge Google Maps si clé
   - Fallback Mapbox
   - Log si échec
   - Sauvegarde chemin en DB

5. **ImageGenModule.generate_batch()**
   - Appel Stability AI si clé
   - Inpainting: ajoute piscine
   - Sauvegarde chemin en DB

6. **MailerModule.send_batch()**
   - Compose HTML personnalisé
   - Intègre images before/after
   - Envoie via Brevo ou sauvegarde draft
   - Enregistre send_at en DB

### Outputs
```
data/leads.db
  properties: 10 rows
  emails: 10 rows (si emails envoyés)

data/images/
  1_before.jpg (satellite)
  1_after.jpg (IA piscine)
  2_before.jpg
  2_after.jpg
  ...

data/email_drafts/
  draft_prospect1_at_example.com_...html (si no API key)
```

## Next Steps / Roadmap

1. **API REST wrapper**
   - GET /properties
   - POST /property
   - DELETE /property/{id}

2. **Dashboard web**
   - Stats en temps réel
   - Map visualization
   - Email analytics

3. **ML scoring**
   - Score de qualité lead
   - Prédiction conversion
   - Prioritization

4. **Intégrations tierces**
   - Webhooks (Zapier, IFTTT)
   - CRM (HubSpot, Pipedrive)
   - SMS fallback (Twilio)

5. **Optimisations**
   - Cache layer (Redis)
   - Worker queue (Celery)
   - Batch processing (Spark)

## Support & Contribution

Pour questions, bugs ou features:
- Consulter README.md
- Vérifier logs (config.py LOG_LEVEL)
- Exécuter test_modules.py
- Contactez: contact@machinealeads.fr
