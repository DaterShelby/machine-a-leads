# APIs Utilisées - Machine à Leads

## Vue d'ensemble

Ce document détaille toutes les APIs externes utilisées par Machine à Leads, leur coût, et comment les configurer.

## 1. DVF API (Demandes de Valeurs Foncières)

**Status**: Obligatoire - Gratuit
**Endpoint**: `https://api.cquest.org/dvf`

### Description
L'API DVF expose les données publiques de transactions immobilières en France. C'est la source de base de notre système de lead generation.

### Utilisation dans le bot
```python
# modules/scraper.py
async def scrape_postal_code(postal_code, nature_mutation, type_local):
    params = {
        "code_postal": "75001",
        "nature_mutation": "Vente",
        "type_local": "Maison",
    }
    response = await session.get(DVF_API_BASE, params=params)
```

### Paramètres
- `code_postal`: Code postal à scanner (ex: "75001")
- `nature_mutation`: Type de mutation (obligatoire: "Vente")
- `type_local`: Type de propriété (obligatoire: "Maison")

### Réponse
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "properties": {
        "valeur_fonciere": 750000,
        "surface_terrain": 500,
        "surface_bati": 180,
        "adresse_numero": "123",
        "adresse_suffixe": "Rue",
        "adresse_nom_voie": "de l'Exemple",
        "commune_nom": "Paris",
        "date_mutation": "2024-06-15",
        "id_mutation": "202406150001"
      }
    }
  ]
}
```

### Configuration
Aucune clé API requise.

### Rate Limiting
- Limite officielle: Non spécifiée
- Respect: 0.5s entre chaque requête (configurable dans config.py)

### Coût
Gratuit

### Problèmes courants
- Status 502: API temporairement indisponible → Réessayer plus tard
- Pas de réponse: Code postal sans données
- Délai d'attente: Données publiques publiées avec latence

---

## 2. API Adresse (Géolocalisation)

**Status**: Optionnel - Gratuit
**Endpoint**: `https://api-adresse.data.gouv.fr/search`

### Description
API gratuite qui convertit une adresse en coordonnées GPS (latitude, longitude).

### Utilisation dans le bot
```python
# modules/scraper.py
async def enrich_coordinates(address, postal_code, city):
    address_str = f"{address}, {postal_code} {city}"
    response = await session.get(
        "https://api-adresse.data.gouv.fr/search",
        params={"q": address_str, "limit": 1}
    )
```

### Paramètres
- `q`: Adresse à rechercher (format libre)
- `limit`: Nombre de résultats max (défaut: 10)

### Réponse
```json
{
  "features": [
    {
      "properties": {
        "label": "123 Rue de l'Exemple 75001 Paris",
        "score": 0.95
      },
      "geometry": {
        "coordinates": [2.3522, 48.8566]
      }
    }
  ]
}
```

### Configuration
Aucune clé API requise.

### Rate Limiting
- Limite officielle: Non spécifiée (1000+/jour observé)
- Respect: 0.3s entre chaque requête

### Coût
Gratuit

### Fallback
Si la géolocalisation échoue, les propriétés sont sauvegardées sans lat/lon (images satellites ne seront pas téléchargées).

---

## 3. Google Maps Static API

**Status**: Optionnel - Payant
**Endpoint**: `https://maps.googleapis.com/maps/api/staticmap`

### Description
Télécharge des images satellites fixes de coordonnées géographiques.

### Utilisation dans le bot
```python
# modules/satellite.py
async def fetch_from_google_maps(lat, lon):
    url = "https://maps.googleapis.com/maps/api/staticmap"
    params = {
        "center": f"{lat},{lon}",
        "zoom": 19,
        "size": "640x640",
        "maptype": "satellite",
        "key": GOOGLE_MAPS_API_KEY
    }
    response = await session.get(url, params=params)
```

### Paramètres
- `center`: Latitude,Longitude
- `zoom`: Niveau de zoom (1-21, défaut 19 pour détail)
- `size`: Dimensions de l'image (défaut 640x640)
- `maptype`: Type de carte (satellite, roadmap, terrain, hybrid)
- `key`: Clé API (requise)

### Configuration

#### Obtenir une clé API
1. Google Cloud Console: https://console.cloud.google.com/
2. Créer un projet
3. Activer "Maps Static API"
4. Créer une clé API
5. Ajouter à `.env`:
```env
GOOGLE_MAPS_API_KEY=AIzaSyD...your_key...
```

#### Restrictions recommandées
- HTTP referrer: Votre domaine
- Quotas: 25,000 requêtes/jour (gratuit après facturation)

### Coût
- Gratuit: Premiers 25,000 requêtes/jour
- Payant: $2 par 1000 requêtes au-delà

### Fallback
Si la clé est manquante ou invalide, le bot essaie Mapbox. Si les deux échouent, continue sans images satellites.

---

## 4. Mapbox Static Images API

**Status**: Optionnel - Payant (Fallback à Google Maps)
**Endpoint**: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static`

### Description
Alternative à Google Maps pour les images satellites.

### Utilisation dans le bot
```python
# modules/satellite.py
async def fetch_from_mapbox(lat, lon):
    url = f"https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/{lon},{lat},{zoom}/{size}"
    params = {"access_token": MAPBOX_API_KEY}
    response = await session.get(url, params=params)
```

### Format URL
```
https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/
{lon},{lat},{zoom},{bearing},{pitch}/{width}x{height}{@2x}
```

### Configuration

#### Obtenir une clé API
1. Mapbox Dashboard: https://account.mapbox.com/
2. Créer un token public (read:tiles)
3. Ajouter à `.env`:
```env
MAPBOX_API_KEY=pk.eyJ...your_token...
```

### Coût
- Gratuit: 50,000 requêtes/mois
- Payant: $0.50 par 1000 requêtes au-delà

### Avantages
- Plus bon marché que Google Maps
- Pas de données personnelles requises
- Quota mensuel généreuse

---

## 5. Stability AI API

**Status**: Optionnel - Payant
**Endpoint**: `https://api.stability.ai/v1/generation/{engine_id}/image-to-image`

### Description
Génère des images avec IA (inpainting) pour ajouter une piscine à une photo satellite.

### Utilisation dans le bot
```python
# modules/image_gen.py
async def generate_pool_image(input_image_path):
    url = f"{api_host}/v1/generation/{engine_id}/image-to-image"
    data = {
        "init_image": base64.b64encode(image_bytes),
        "text_prompts": [{
            "text": "Aerial view with swimming pool...",
            "weight": 1
        }],
        "image_strength": 0.35,
        "steps": 20,
        "cfg_scale": 7.5,
        "samples": 1
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    response = await session.post(url, json=data, headers=headers)
```

### Paramètres
- `init_image`: Image de base en base64
- `text_prompts`: Liste des prompts texte
- `image_strength`: Force de transformation (0-1, défaut 0.35)
- `steps`: Nombre d'itérations (1-50, défaut 20)
- `cfg_scale`: Guidage du prompt (0-35, défaut 7.5)
- `samples`: Nombre d'images à générer

### Configuration

#### Obtenir une clé API
1. Stability AI Dashboard: https://platform.stability.ai/
2. S'inscrire et valider email
3. Générer une clé API
4. Ajouter à `.env`:
```env
STABILITY_AI_API_KEY=sk-...your_key...
```

### Prompt
Notre prompt optimisé pour piscines:
```
Aerial satellite view of a backyard with a modern rectangular
swimming pool with turquoise water, stone decking, realistic shadows,
photorealistic, 4K
```

Prompt négatif:
```
distorted, unrealistic, cartoon, blurry, low quality
```

### Coût
- Crédit d'essai: 25 crédits gratuits
- Payant: Environ $0.03 par image (selon le modèle)
- Forfait: Différentes options d'abonnement disponibles

### Performance
- Temps de génération: ~30 secondes par image
- Modèle: stable-diffusion-xl-1024-v1-0

---

## 6. Brevo SMTP API

**Status**: Optionnel - Gratuit (300/jour) ou Payant (illimité)
**Endpoint**: `https://api.brevo.com/v3/smtp/email`

### Description
Service d'email professionnel pour envoyer les campagnes personnalisées.

### Utilisation dans le bot
```python
# modules/mailer.py
async def send_email(recipient_email, subject, html_body):
    url = "https://api.brevo.com/v3/smtp/email"
    payload = {
        "sender": {"email": "contact@machinealeads.fr"},
        "to": [{"email": recipient_email}],
        "subject": subject,
        "htmlContent": html_body
    }
    headers = {"api-key": BREVO_API_KEY}
    response = await session.post(url, json=payload, headers=headers)
```

### Paramètres
- `sender`: Objet avec email et name
- `to`: Liste des destinataires
- `subject`: Sujet de l'email
- `htmlContent`: Corps en HTML
- `tags`: Tags pour filtrage (optionnel)

### Configuration

#### Obtenir une clé API
1. Brevo Dashboard: https://app.brevo.com/
2. S'inscrire (gratuit)
3. Aller dans Paramètres → Clés API
4. Créer une nouvelle clé avec permissions SMTP
5. Ajouter à `.env`:
```env
BREVO_API_KEY=xkeysib_...your_key...
```

### Quotas
- **Gratuit**: 300 emails/jour, max 20,000/mois
- **Payant**: À partir de $20/mois pour illimité
- Forfaits flexibles selon le volume

### Coût
- Gratuit: 300/jour max
- Payant: $20-$249/mois selon forfait

### Template HTML
Notre template inclut:
- Images before/after côte à côte
- Personnalisation adresse propriété
- CTA "Je veux un devis"
- RGPD unsubscribe link
- Design responsive

### Fallback
Si pas de clé API, les emails sont sauvegardés en HTML local dans `data/email_drafts/`

---

## Matrice de dépendance

| API | Obligatoire | Gratuit | Configuration | Fallback |
|-----|-------------|---------|---------------|---------| 
| DVF | OUI | OUI | Non | Non (requis) |
| Adresse | NON | OUI | Non | Skip enrichissement |
| Google Maps | NON | NON* | Clé API | Mapbox ou skip |
| Mapbox | NON | NON* | Token | Skip images |
| Stability AI | NON | NON* | Clé API | Skip génération |
| Brevo | NON | OUI* | Clé API | Sauvegarde locale |

*Gratuit à partir de certains quotas

---

## Résumé des coûts (à l'échelle)

Pour traiter 1000 propriétés:
- DVF: Gratuit
- Adresse: Gratuit
- Google Maps: $2 (1000 requêtes)
- Mapbox: $0.50 (1000 requêtes)
- Stability AI: ~$30 (1000 images)
- Brevo: Gratuit (si < 300/jour) ou $20/mois

**Total mois**: ~$50-100 pour traiter 1000 leads

---

## Bonnes pratiques

1. **Démarrer gratuit**: Utiliser DVF + Adresse sans autres APIs
2. **Ajouter graduellement**: Images, puis emails
3. **Monitorer les quotas**: Vérifier consommation API mensuellement
4. **Cacher les clés**: Jamais committre `.env` en git
5. **Documenter**: Garder `.env.example` à jour

---

## Troubleshooting

### DVF API 502
- Temporaire, réessayer après quelques minutes
- Vérifier format des paramètres

### Google Maps "Invalid key"
- Vérifier activation de l'API
- Vérifier restrictions IP/referrer
- Vérifier quota restant

### Mapbox "Unauthorized"
- Token expiré ou révoqué
- Vérifier scope "read:tiles"
- Regénérer le token

### Stability AI "Invalid API key"
- Vérifier préfixe "sk-"
- Vérifier crédit API restant
- Ne pas exposer la clé en logs

### Brevo "Invalid sender"
- Vérifier domaine configuré
- Vérifier adresse email valide
- Vérifier SPF/DKIM

---

## Ressources

- DVF: https://doc.cquest.org/
- Adresse: https://adresse.data.gouv.fr/api
- Google Maps: https://developers.google.com/maps/documentation/maps-static/overview
- Mapbox: https://docs.mapbox.com/api/maps/static-images/
- Stability AI: https://platform.stability.ai/docs
- Brevo: https://developers.brevo.com/docs

