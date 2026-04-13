# Intégration DVF - Documentation

## Vue d'ensemble

Le dashboard Next.js 14 intègre maintenant l'API DVF gratuite (https://api.cquest.org/dvf) pour afficher les VRAIES données immobilières au lieu de mock data.

## Architecture

### API Routes (côté serveur)

#### `/api/dvf/search` - Recherche de propriétés
- **Méthode**: GET
- **Paramètres**:
  - `code_postal` (requis): "06000"
  - `prix_min` (optionnel): "500000"
  - `prix_max` (optionnel): "1200000"
  - `surface_terrain_min` (optionnel): "200"
  - `limit` (optionnel): "100"

- **Retour**: 
```json
{
  "success": true,
  "count": 42,
  "total": 156,
  "filters": { /* paramètres appliqués */ },
  "data": [
    {
      "id": "dvf_0",
      "adresse": "123 Rue de la Paix",
      "ville": "Nice",
      "code_postal": "06000",
      "prix": 650000,
      "surface_terrain": 350,
      "surface_bati": 120,
      "pieces": 4,
      "type_local": "Maison",
      "date_mutation": "2024-03-13",
      "latitude": 43.7102,
      "longitude": 7.2620
    }
  ]
}
```

#### `/api/dvf/stats` - Statistiques agrégées
- **Méthode**: GET
- **Paramètres**:
  - `code_postal` (requis): "06000"
  - `nature_mutation` (optionnel): "Vente"
  - `type_local` (optionnel): "Maison"

- **Retour**:
```json
{
  "success": true,
  "filters": { /* paramètres appliqués */ },
  "stats": {
    "total_properties": 156,
    "properties_with_price": 142,
    "average_price": 825000,
    "median_price": 750000,
    "min_price": 300000,
    "max_price": 2500000,
    "price_per_m2": 5200,
    "surface_terrain_avg": 450,
    "top_cities": [
      { "city": "Nice", "count": 45, "avg_price": 850000 },
      { "city": "Cannes", "count": 32, "avg_price": 920000 }
    ]
  }
}
```

## Pages modifiées

### 1. Dashboard (`/app/(dashboard)/dashboard/page.tsx`)
- **Avant**: Stats hardcodées
- **Après**: 
  - Formulaire de recherche: code postal + prix min/max
  - Bouton "Scanner" qui appelle `/api/dvf/search`
  - Stats dynamiques basées sur les résultats réels
  - Loading state avec spinner
  - Message "Aucun résultat" si pas de propriétés

**Utilisation**:
```tsx
const response = await fetch(
  `/api/dvf/search?code_postal=${codePostal}&prix_min=${prixMin}&prix_max=${prixMax}`
);
const data = await response.json();
```

### 2. Leads (`/app/(dashboard)/leads/page.tsx`)
- **Avant**: Mock leads statiques
- **Après**:
  - Card d'import DVF
  - Chargement en temps réel avec filtres (CP, prix min/max)
  - Fusion des DVF leads avec mock leads
  - Status: `non_traite`, `image_satellite`, `ia_genere`, `email_envoye`
  - Affichage du prix comme "email" pour les DVF leads
  - Surface terrain en sous-titre

**Colonnes affichées**:
- Adresse / Surface
- Ville / Code Postal
- Vertical (Propriété DVF)
- Status (badge coloré)
- Date de mutation
- Action (lien vers détail)

### 3. Pipeline (`/app/(dashboard)/pipeline/page.tsx`)
- **Avant**: Jobs de processing
- **Après**: Visuelle du pipeline à 6 étapes

**Étapes du pipeline**:
1. 🔍 **Scraping DVF** → 156 propriétés trouvées (✅ Fonctionnel)
2. 🎯 **Filtrage** → 142 propriétés qualifiées (✅ Fonctionnel)
3. 🛰️ **Image Satellite** → (⚠️ Nécessite Google Maps API)
4. 🎨 **Génération IA** → (⚠️ Nécessite Stability AI)
5. 📧 **Email** → (⚠️ Nécessite Brevo API)
6. 🔄 **Suivi** → (✅ Fonctionnel)

Status visuel:
- ✅ Vert = Fonctionnel
- ⚠️ Jaune = Clé API manquante
- ❌ Rouge = Non configuré

### 4. Verticals (`/app/(dashboard)/verticals/page.tsx`)
- **Avant**: Descriptions génériques
- **Après**:
  - Ajout des "Critères de ciblage"
  - Prompts IA détaillés et spécifiques à chaque vertical
  - Affichage des critères dans les cards

**8 Verticals configurés**:
1. **Piscine**: Terrain > 300m², prix > 500k€
2. **Solaire**: Toitures sud, maisons récentes, budget > 15k€
3. **Terrasse**: Jardins spacieux, terrain plat
4. **Veranda**: Accès jardin, budget > 20k€
5. **Paysager**: Terrains > 500m², propriétaires
6. **Extension**: Maisons > 20 ans, budget > 50k€
7. **Carport**: Propriétés avec allée
8. **Clôture**: Terrains avec périmètre visible

### 5. Settings (`/app/(dashboard)/settings/page.tsx`)
- **Avant**: Onglets: Profile, API Keys, Notifications, Billing
- **Après**: Onglets: Profile, Clés API, Ciblage, Email, Notifications

**Onglet "Clés API"**:
- Champs input pour Stability AI, Google Maps, Brevo
- Toggle eye/eye-off pour masquer/afficher
- Bouton "Tester la connexion" (simule test 1.5s)
- Status visuel: ✅ OK / ❌ Erreur / ⏳ Test en cours

**Onglet "Ciblage"**:
- Prix minimum (€)
- Prix maximum (€)
- Surface terrain minimum (m²)
- Départements (codes séparés par virgules)

**Onglet "Email"**:
- Nom de l'expéditeur
- Email de l'expéditeur
- Objet par défaut

Tous les paramètres sont sauvegardés dans `localStorage` (démo uniquement, en production: base de données chiffrée).

## Configuration d'environnement

Aucune clé API n'est requise pour DVF (API gratuite et publique).

Pour les autres services, créez des variables d'environnement:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
STABILITY_AI_API_KEY=...
BREVO_API_KEY=...
```

## Flux d'utilisation

1. **Dashboard**: Utilisateur recherche par code postal et prix → affiche les stats
2. **Leads**: Utilisateur charge les DVF leads du CP → fusionne avec base existante
3. **Pipeline**: Affiche le statut de chaque étape du traitement
4. **Settings**: Utilisateur configure les clés API manquantes
5. **Verticals**: Affiche les critères de ciblage spécifiques

## Points techniques

### Frontend (Client Components)
- `useState` pour formulaires et état local
- `useEffect` pour appels API au montage
- `fetch()` vers `/api/dvf/search` et `/api/dvf/stats`
- Loading spinners avec `Loader2` icon
- TypeScript avec interfaces pour les données

### Backend (API Routes)
- Routes dynamiques avec `export const dynamic = 'force-dynamic'`
- Fetch vers `https://api.cquest.org/dvf` en parallèle
- Filtrage et enrichissement des données
- Gestion des erreurs avec try/catch
- Retour JSON structuré

### Design
- Cohérent avec le dark theme existant (slate-950, blue-600)
- Cards, DataTable, Badges du système de design
- Responsive (1 col mobile, 2-3 cols desktop)
- Animations et transitions sur hover

## Déploiement Netlify

Build: `npm run build` ✅ Sans erreurs
Routes API: ✅ Compilées comme fonctions serverless
Static pages: ✅ Pré-générées
Dynamic pages: ✅ Server-rendered on demand

Site: https://machine-a-leads.netlify.app

## Limitations de la démo

- Les clés API sont stockées en localStorage (pour démo uniquement)
- Les connexions API sont simulées (timeout 1.5s)
- Pas de persistence en base de données
- Les données DVF sont en temps réel via leur API publique

## Prochaines étapes

Pour production:
1. Migrer localStorage vers une base de données sécurisée
2. Chiffrer les clés API au stockage
3. Implémenter les réels appels Google Maps, Stability AI, Brevo
4. Ajouter l'authentification utilisateur
5. Implémenter le suivi des conversions
6. Ajouter des webhooks pour les emails
