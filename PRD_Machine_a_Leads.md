# PRD - Machine a Leads

## Product Requirements Document v2.0

**Projet:** Machine a Leads - Plateforme Automatisee de Generation de Leads Multi-Vertical
**Date:** 13 Avril 2026
**Auteur:** Tommy (CEO / Ingenieur IA)
**Statut:** En cours de developpement

---

## 1. Vision Produit

### 1.1 Probleme
Les artisans et installateurs (piscines, panneaux solaires, terrasses, verandas, amenagement paysager, extensions...) manquent de leads qualifies. Les proprietaires de maisons ne visualisent pas le potentiel de leur terrain. Il n'existe pas de solution automatisee qui identifie ces proprietaires, genere des visuels IA personnalises "avant/apres" et les contacte de maniere ciblee.

### 1.2 Solution
Une plateforme SaaS multi-vertical qui :
1. Identifie les proprietes ciblees via donnees immobilieres (DVF)
2. Recupere les images satellites de chaque propriete
3. Genere des visuels IA "avant/apres" adaptes au vertical choisi
4. Envoie des emails personnalises avec ces visuels
5. Suit les conversions et relances automatiquement

### 1.3 Verticaux Supportes

| Vertical | Description | Cible |
|----------|-------------|-------|
| Piscine | Ajout piscine dans jardin | Maisons 500K-1.2M, terrain > 300m2 |
| Panneaux Solaires | Installation sur toiture | Maisons toutes gammes, toit visible |
| Terrasse / Patio | Amenagement exterieur | Maisons avec jardin nu |
| Veranda | Extension vitree | Maisons avec facade degagee |
| Amenagement Paysager | Jardin design complet | Maisons terrain > 200m2 |
| Extension Maison | Agrandissement | Maisons avec terrain constructible |
| Carport / Garage | Abri vehicule | Maisons sans garage visible |
| Cloture / Portail | Securisation propriete | Maisons sans cloture visible |

Chaque vertical a son propre :
- **Prompt IA** pour la generation d'images
- **Templates email** personnalises
- **Criteres de ciblage** specifiques
- **Partenaires installateurs** locaux

### 1.4 Business Model
- Commission par lead converti aupres des installateurs partenaires
- Abonnement SaaS pour installateurs (acces direct dashboard)
- Volume : 500-2000 proprietes traitees/jour/vertical
- Couts mensuels estimes : 45-380 EUR selon usage API

---

## 2. Architecture Technique

### 2.1 Stack Technologique

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Frontend + Backend | Next.js 14 (App Router) | Full-stack TypeScript, SSR, API Routes |
| Base de donnees | Supabase (PostgreSQL) | Auth integree, Realtime, Storage |
| Generation IA | Stability AI (SDXL Inpainting) | Qualite/prix optimal, ~0.01 EUR/image |
| Images Satellite | Google Maps Static API | Couverture France complete |
| Emailing | Brevo (ex-Sendinblue) | API francaise, RGPD natif |
| Deploiement | Netlify | Serverless functions, CI/CD auto |
| Langage | TypeScript | Type safety, maintenabilite |
| Tests | Vitest + Testing Library | Rapide, compatible Next.js |
| Style | Tailwind CSS + shadcn/ui | UI pro, composants accessibles |
| Validation | Zod | Schema validation runtime |
| ORM | Supabase Client | Type-safe queries |

### 2.2 Architecture Systeme

```
                    +-------------------+
                    |   Dashboard UI    |
                    |   (Next.js SSR)   |
                    +--------+----------+
                             |
                    +--------+----------+
                    |   API Routes      |
                    |   (Next.js)       |
                    +--------+----------+
                             |
          +------------------+------------------+
          |                  |                  |
+---------+-------+ +-------+--------+ +-------+--------+
| Supabase        | | Pipeline Engine| | External APIs  |
| - PostgreSQL    | | - Job Queue    | | - DVF API      |
| - Auth          | | - Workers      | | - Google Maps  |
| - Storage       | | - Scheduler    | | - Stability AI |
| - Realtime      | |                | | - Brevo        |
+-----------------+ +----------------+ +----------------+
```

### 2.3 Schema Base de Donnees

#### Table: verticals
- id (uuid, PK)
- name (text) -- ex: "piscine", "solaire", "terrasse"
- display_name (text) -- ex: "Piscine", "Panneaux Solaires"
- description (text)
- icon (text) -- emoji ou icon name
- ai_prompt (text) -- prompt Stability AI pour ce vertical
- ai_negative_prompt (text)
- target_min_price (integer)
- target_max_price (integer)
- target_min_land_area (integer)
- is_active (boolean, default true)
- created_at (timestamptz)

#### Table: properties
- id (uuid, PK)
- dvf_id (text, unique) -- ID transaction DVF
- address (text)
- city (text)
- department (varchar(3))
- postal_code (varchar(5))
- latitude (decimal)
- longitude (decimal)
- price (integer)
- surface_area (integer) -- surface habitable
- land_area (integer) -- surface terrain
- property_type (text) -- maison, appartement
- transaction_date (date)
- satellite_image_url (text)
- satellite_fetched_at (timestamptz)
- metadata (jsonb)
- created_at (timestamptz)
- updated_at (timestamptz)

#### Table: campaigns
- id (uuid, PK)
- user_id (uuid, FK -> auth.users)
- vertical_id (uuid, FK -> verticals)
- name (text)
- description (text)
- status (enum: draft, active, paused, completed)
- target_cities (text[])
- target_departments (text[])
- target_postal_codes (text[])
- min_price (integer)
- max_price (integer)
- min_land_area (integer)
- email_template_id (uuid, FK -> email_templates)
- total_properties (integer, default 0)
- total_sent (integer, default 0)
- total_opened (integer, default 0)
- total_clicked (integer, default 0)
- total_converted (integer, default 0)
- created_at (timestamptz)
- updated_at (timestamptz)

#### Table: leads
- id (uuid, PK)
- property_id (uuid, FK -> properties)
- campaign_id (uuid, FK -> campaigns)
- vertical_id (uuid, FK -> verticals)
- email (text)
- first_name (text)
- last_name (text)
- phone (text)
- status (enum: new, image_generated, contacted, opened, clicked, responded, converted, unsubscribed)
- original_image_url (text) -- image satellite originale
- generated_image_url (text) -- image IA avec amenagement
- email_sent_at (timestamptz)
- email_opened_at (timestamptz)
- email_clicked_at (timestamptz)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)

#### Table: email_templates
- id (uuid, PK)
- vertical_id (uuid, FK -> verticals)
- name (text)
- subject (text)
- body_html (text)
- body_text (text)
- variables (jsonb) -- liste des variables disponibles
- is_default (boolean, default false)
- created_at (timestamptz)
- updated_at (timestamptz)

#### Table: pipeline_jobs
- id (uuid, PK)
- campaign_id (uuid, FK -> campaigns)
- type (enum: data_collection, satellite_fetch, ai_generation, email_send, follow_up)
- status (enum: pending, running, completed, failed, cancelled)
- progress (integer, 0-100)
- total_items (integer)
- processed_items (integer)
- error_message (text)
- metadata (jsonb)
- started_at (timestamptz)
- completed_at (timestamptz)
- created_at (timestamptz)

#### Table: follow_up_sequences
- id (uuid, PK)
- campaign_id (uuid, FK -> campaigns)
- step_number (integer) -- 1, 2, 3...
- delay_days (integer) -- delai depuis email precedent
- email_template_id (uuid, FK -> email_templates)
- subject_override (text)
- is_active (boolean, default true)
- created_at (timestamptz)

---

## 3. Modules Fonctionnels

### 3.1 Module Data Collection (DVF)
- API DVF publique (data.gouv.fr)
- Filtrage par prix, surface, type, localisation
- Enrichissement GPS via geocodage
- Deduplication des proprietes
- Import batch par departement

### 3.2 Module Images Satellites
- Google Maps Static API (zoom 19-20)
- Cache Supabase Storage
- Fallback Mapbox si quota depasse
- Resolution optimale pour IA (640x640)

### 3.3 Module Generation IA (Multi-Vertical)
- Stability AI SDXL Inpainting
- Prompt dynamique selon vertical selectionne
- Detection zone d'insertion automatique
- Generation de masque adaptatif
- Qualite controlee avant envoi

### 3.4 Module Emailing
- Brevo API v3
- Templates dynamiques par vertical
- Tracking complet (ouverture, clic)
- Sequences de relance automatiques
- Conformite RGPD

### 3.5 Dashboard Analytics
- KPIs temps reel par campagne et vertical
- Carte interactive des proprietes
- Gestion leads avec filtres avances
- Comparaison performance entre verticaux
- Export CSV/Excel

---

## 4. Pages de l'Application

1. **/** - Landing page publique
2. **/login** - Connexion
3. **/register** - Inscription
4. **/dashboard** - Vue d'ensemble KPIs
5. **/campaigns** - Liste campagnes
6. **/campaigns/new** - Nouvelle campagne (choix vertical)
7. **/campaigns/[id]** - Detail campagne + pipeline
8. **/leads** - Tous les leads (filtrable par vertical)
9. **/leads/[id]** - Detail lead + visuels avant/apres
10. **/pipeline** - Vue pipeline global
11. **/templates** - Gestion templates email
12. **/verticals** - Configuration des verticaux
13. **/settings** - API keys, preferences, profil

---

## 5. API Endpoints

```
# Auth
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout

# Verticals
GET    /api/verticals
POST   /api/verticals
PUT    /api/verticals/[id]

# Campaigns
GET    /api/campaigns
POST   /api/campaigns
GET    /api/campaigns/[id]
PUT    /api/campaigns/[id]
DELETE /api/campaigns/[id]
POST   /api/campaigns/[id]/start
POST   /api/campaigns/[id]/pause

# Leads
GET    /api/leads
GET    /api/leads/[id]
PUT    /api/leads/[id]
GET    /api/leads/export

# Properties
GET    /api/properties
POST   /api/properties/search
GET    /api/properties/[id]

# Pipeline
POST   /api/pipeline/collect
POST   /api/pipeline/satellite
POST   /api/pipeline/generate
POST   /api/pipeline/send
GET    /api/pipeline/jobs
GET    /api/pipeline/jobs/[id]

# Templates
GET    /api/templates
POST   /api/templates
PUT    /api/templates/[id]
DELETE /api/templates/[id]

# Analytics
GET    /api/analytics/overview
GET    /api/analytics/verticals
GET    /api/analytics/campaigns/[id]

# Webhooks
POST   /api/webhooks/email (tracking Brevo)
```

---

## 6. Securite & Conformite

### RGPD
- Lien desinscription obligatoire
- Droit a l'oubli
- Consentement trace
- Pas de donnees sensibles stockees inutilement

### Securite
- Supabase Auth (JWT + RLS)
- Variables d'environnement pour API keys
- Rate limiting
- Validation Zod sur tous les inputs
- CORS configure

---

## 7. Structure des Fichiers

```
machine-a-leads/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── campaigns/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── pipeline/page.tsx
│   │   │   ├── templates/page.tsx
│   │   │   ├── verticals/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── campaigns/
│   │   │   ├── leads/
│   │   │   ├── pipeline/
│   │   │   ├── templates/
│   │   │   ├── verticals/
│   │   │   ├── analytics/
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── dashboard/
│   │   ├── campaigns/
│   │   ├── leads/
│   │   └── shared/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── types.ts
│   │   ├── services/
│   │   │   ├── dvf.ts
│   │   │   ├── satellite.ts
│   │   │   ├── ai-generator.ts
│   │   │   ├── email.ts
│   │   │   └── pipeline.ts
│   │   ├── utils/
│   │   └── validators/
│   └── types/
├── supabase/
│   └── migrations/
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```
