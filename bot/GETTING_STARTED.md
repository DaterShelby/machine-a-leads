# Machine à Leads - Getting Started

## En 5 minutes

### 1. Installation
```bash
cd /sessions/confident-lucid-brahmagupta/build-deploy/bot
./quickstart.sh
```

### 2. Premiers pas (SANS API key)
```bash
# Voir les statistiques
python bot.py --stats

# Scanner les données DVF (gratuit)
python bot.py --mode=scan
python bot.py --mode=scan --codes 75001 75002 92100
```

### 3. Mode test (5 propriétés)
```bash
python bot.py --mode=test
```

### 4. Pipeline complet (optionnel avec API keys)
```bash
# Éditer le fichier .env avec vos clés API
nano .env

# Lancer le pipeline complet
python bot.py --mode=run
```

---

## Structure du projet

```
machine-a-leads/bot/
├── bot.py                  ← Exécutable principal
├── config.py               ← Configuration
├── requirements.txt        ← Dépendances
├── .env                    ← Variables d'environnement (à créer)
├── README.md               ← Documentation complète
├── ARCHITECTURE.md         ← Architecture technique
├── APIS.md                 ← Détails des APIs
├── test_modules.py         ← Tests unitaires
├── modules/
│   ├── scraper.py          ← DVF scraping
│   ├── database.py         ← SQLite
│   ├── satellite.py        ← Images satellites
│   ├── image_gen.py        ← Génération IA
│   └── mailer.py           ← Emails
└── data/
    ├── leads.db            ← Base de données
    └── images/             ← Images téléchargées
```

---

## Commandes principales

```bash
# Voir les statistiques
python bot.py --stats

# Scraper DVF (mode défaut)
python bot.py --mode=scan

# Scraper codes postaux spécifiques
python bot.py --mode=scan --codes 75001 75002 92100

# Traiter 5 propriétés pour tester
python bot.py --mode=test

# Pipeline complet (scan + images + emails)
python bot.py --mode=run

# Lancer les tests
python test_modules.py

# Afficher l'aide
python bot.py --help
```

---

## Configuration des APIs (optionnel)

### Éditer le fichier .env
```bash
# Google Maps (images satellites)
GOOGLE_MAPS_API_KEY=AIzaSyD...

# Mapbox (images satellites - fallback)
MAPBOX_API_KEY=pk.eyJ...

# Stability AI (génération IA piscines)
STABILITY_AI_API_KEY=sk-...

# Brevo (emails)
BREVO_API_KEY=xkeysib_...

# Email sender
SENDER_EMAIL=contact@machinealeads.fr
SENDER_NAME=Machine à Leads
```

Voir `APIS.md` pour les détails de configuration.

---

## Workflow recommandé

### Phase 1: Test (gratuit)
1. `./quickstart.sh` - Installation
2. `python bot.py --stats` - Vérifier
3. `python bot.py --mode=scan --codes 75001 75002` - Petit scan
4. `python bot.py --mode=test` - Traiter 5 propriétés

### Phase 2: Scraping DVF (gratuit)
1. Éditer `config.py` pour définir les codes postaux
2. `python bot.py --mode=scan` - Scraper les données
3. `python bot.py --stats` - Voir les résultats

### Phase 3: Images (payant)
1. Obtenir clés API Google Maps ou Mapbox
2. Ajouter à `.env`
3. `python bot.py --mode=test` - Télécharger 5 images

### Phase 4: Emails (gratuit à 300/jour)
1. Obtenir clé API Brevo
2. Ajouter à `.env`
3. `python bot.py --mode=run` - Pipeline complet

---

## Exemples concrets

### Exemple 1: Tester avec Île-de-France
```bash
# Scraper 75 et 92 (Paris + Hauts-de-Seine)
python bot.py --mode=scan --codes 75001 75002 75003 92100 92110

# Voir résultats
python bot.py --stats

# Traiter 5 propriétés
python bot.py --mode=test
```

### Exemple 2: Exporter en CSV
```bash
# D'abord créer les propriétés
python bot.py --mode=scan

# Puis exporter (dans le code)
python -c "
from modules.database import Database
from pathlib import Path
import config

db = Database(config.DB_PATH)
db.export_csv(Path('export.csv'))
print('Exporté en export.csv')
"
```

### Exemple 3: Statistiques avancées
```bash
python -c "
from modules.database import Database
from pathlib import Path
import config

db = Database(config.DB_PATH)
props = db.get_all_properties()

print(f'Total: {len(props)} propriétés')
for city in set(p['city'] for p in props):
    count = len([p for p in props if p['city'] == city])
    avg_price = sum(p['price'] for p in props if p['city'] == city) // count
    print(f'  {city}: {count} props, prix moyen {avg_price}€')
"
```

---

## Coûts estimés

| Étape | Coût |
|-------|------|
| Scraping DVF | Gratuit |
| Géolocalisation | Gratuit |
| Images satellites | $0.50-2 pour 1000 |
| Génération IA | ~$30 pour 1000 |
| Emails | Gratuit (300/jour) ou $20/mois |
| **Total pour 1000 leads** | **$50-100/mois** |

---

## Troubleshooting

### "No such file or directory"
```bash
# Vérifier que vous êtes dans le bon dossier
pwd
# Devrait être: /sessions/confident-lucid-brahmagupta/build-deploy/bot
```

### "ModuleNotFoundError: No module named 'aiohttp'"
```bash
# Réinstaller les dépendances
pip install -r requirements.txt
```

### "Database is locked"
```bash
# Attendre 30 secondes et réessayer
# Ou supprimer data/leads.db et recommencer
rm data/leads.db
```

### "API key invalid"
```bash
# Vérifier .env
cat .env

# Vérifier que les clés ne sont pas expirées
# Vérifier les quotas
```

---

## Prochaines étapes

### Si c'est votre première utilisation
1. Lire le README.md
2. Exécuter `python test_modules.py` pour tester
3. Essayer `python bot.py --mode=scan`

### Si vous développez
1. Consulter `ARCHITECTURE.md`
2. Consulter `APIS.md` pour intégrations
3. Modifier `modules/` selon vos besoins

### Si vous montez en production
1. Migrer vers PostgreSQL
2. Ajouter Redis pour cache
3. Configurer monitoring
4. Créer une API REST
5. Mettre en place un dashboard

---

## Support

- **Documentation**: Voir README.md, ARCHITECTURE.md, APIS.md
- **Tests**: Exécuter `python test_modules.py`
- **Issues**: Vérifier les logs (augmenter LOG_LEVEL en .env)
- **Contact**: contact@machinealeads.fr

---

## Prêt? Commencez!

```bash
cd /sessions/confident-lucid-brahmagupta/build-deploy/bot
./quickstart.sh
python bot.py --stats
```

Bon scraping!
