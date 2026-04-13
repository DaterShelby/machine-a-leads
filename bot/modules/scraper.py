"""
Module de scraping des données DVF (Demandes de Valeurs Foncières).
Utilise l'API data.gouv.fr pour télécharger les données CSV par commune (code INSEE).
"""

import asyncio
import aiohttp
import csv
import logging
from typing import List, Dict, Optional, Any, Set
from datetime import datetime
import io

logger = logging.getLogger(__name__)

# ============================================================
# FOCUS ÎLE-DE-FRANCE — Val-d'Oise (95) PRIORITÉ + 92/93 + Méru (60)
# ============================================================

# Val-d'Oise (95) — DÉPARTEMENT PRIORITAIRE
VALDOISE_COMMUNES = [
    "95018",  # Argenteuil
    "95059",  # Beauchamp
    "95063",  # Bezons
    "95101",  # Bouffemont
    "95127",  # Cergy
    "95169",  # Cormeilles-en-Parisis
    "95197",  # Deuil-la-Barre
    "95203",  # Domont
    "95210",  # Eaubonne
    "95219",  # Enghien-les-Bains
    "95229",  # Ermont
    "95252",  # Franconville
    "95268",  # Garges-lès-Gonesse
    "95277",  # Gonesse
    "95280",  # Goussainville
    "95306",  # Herblay-sur-Seine
    "95323",  # Jouy-le-Moutier
    "95351",  # L'Isle-Adam
    "95394",  # Montmorency
    "95426",  # Osny
    "95488",  # Pontoise
    "95491",  # Presles
    "95527",  # Saint-Gratien
    "95539",  # Saint-Leu-la-Forêt
    "95555",  # Saint-Ouen-l'Aumône
    "95572",  # Saint-Prix
    "95585",  # Sarcelles
    "95607",  # Taverny
    "95637",  # Vauréal
    "95680",  # Villiers-le-Bel
    "95424",  # Méry-sur-Oise
    "95328",  # Margency
    "95563",  # Soisy-sous-Montmorency
    "95019",  # Arnouville
    "95199",  # Deuil-la-Barre
]

# Hauts-de-Seine (92) — grandes communes résidentielles
HAUTSDESEINE_COMMUNES = [
    "92049",  # Nanterre
    "92050",  # Neuilly-sur-Seine
    "92062",  # Rueil-Malmaison
    "92040",  # Levallois-Perret
    "92012",  # Boulogne-Billancourt
    "92025",  # Colombes
    "92004",  # Asnières-sur-Seine
    "92032",  # Garches
    "92035",  # La Garenne-Colombes
    "92048",  # Meudon
    "92073",  # Suresnes
    "92064",  # Saint-Cloud
    "92077",  # Ville-d'Avray
    "92022",  # Clamart
    "92019",  # Châtillon
    "92020",  # Chaville
    "92060",  # Le Plessis-Robinson
    "92071",  # Sceaux
]

# Seine-Saint-Denis (93) — communes avec maisons
SEINESAINTDENIS_COMMUNES = [
    "93001",  # Aubervilliers
    "93005",  # Aulnay-sous-Bois
    "93007",  # Le Blanc-Mesnil
    "93008",  # Bobigny
    "93010",  # Bondy
    "93027",  # La Courneuve
    "93029",  # Drancy
    "93030",  # Dugny
    "93031",  # Épinay-sur-Seine
    "93032",  # Gagny
    "93039",  # L'Île-Saint-Denis
    "93045",  # Les Lilas
    "93046",  # Livry-Gargan
    "93047",  # Montfermeil
    "93048",  # Montreuil
    "93049",  # Neuilly-Plaisance
    "93050",  # Neuilly-sur-Marne
    "93051",  # Noisy-le-Grand
    "93053",  # Noisy-le-Sec
    "93055",  # Pantin
    "93057",  # Les Pavillons-sous-Bois
    "93059",  # Pierrefitte-sur-Seine
    "93061",  # Le Raincy
    "93063",  # Romainville
    "93064",  # Rosny-sous-Bois
    "93066",  # Saint-Denis
    "93070",  # Saint-Ouen-sur-Seine
    "93071",  # Sevran
    "93073",  # Stains
    "93077",  # Villemomble
    "93078",  # Villepinte
    "93079",  # Villetaneuse
]

# Méru (60) — prix plus bas, terrain plus grand
MERU_COMMUNES = [
    "60395",  # Méru
]

# CONFIGURATION PAR DÉFAUT — IDF focus
IDF_COMMUNES = {
    "95": VALDOISE_COMMUNES,   # PRIORITÉ
    "92": HAUTSDESEINE_COMMUNES,
    "93": SEINESAINTDENIS_COMMUNES,
    "60": MERU_COMMUNES,
}

# Legacy — garde pour rétrocompatibilité
MAJOR_CITIES_INSEE = {
    "95": VALDOISE_COMMUNES,
    "92": HAUTSDESEINE_COMMUNES,
    "93": SEINESAINTDENIS_COMMUNES,
    "60": MERU_COMMUNES,
}
SOUTH_FRANCE_COMMUNES = IDF_COMMUNES  # Redirige vers IDF


class Scraper:
    """Scraper pour récupérer les données DVF depuis data.gouv.fr."""

    def __init__(self, batch_size: int = 3, request_delay: float = 1.0):
        """
        Initialiser le scraper.

        Args:
            batch_size: Nombre de communes à télécharger en parallèle
            request_delay: Délai en secondes entre chaque requête (rate limiting)
        """
        self.batch_size = batch_size
        self.request_delay = request_delay
        self.dvf_csv_base = "https://files.data.gouv.fr/geo-dvf/latest/csv/2023/communes"

    async def download_commune_csv(
        self,
        dept_code: str,
        insee_code: str,
        session: aiohttp.ClientSession,
    ) -> str:
        """
        Télécharger le CSV d'une commune depuis data.gouv.fr.

        Args:
            dept_code: Code du département (ex: "06")
            insee_code: Code INSEE de la commune (ex: "06088")
            session: Session aiohttp

        Returns:
            Contenu du CSV en tant que string, ou string vide si erreur
        """
        await asyncio.sleep(self.request_delay)

        url = f"{self.dvf_csv_base}/{dept_code}/{insee_code}.csv"
        logger.debug(f"Téléchargement CSV depuis: {url}")

        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status != 200:
                    logger.warning(f"Erreur téléchargement CSV {insee_code}: status {response.status}")
                    return ""

                content = await response.text()
                logger.debug(f"CSV téléchargé pour {insee_code} ({len(content)} bytes)")
                return content

        except asyncio.TimeoutError:
            logger.error(f"Timeout téléchargement CSV {insee_code}")
            return ""
        except Exception as e:
            logger.error(f"Erreur téléchargement CSV {insee_code}: {e}")
            return ""

    def parse_and_filter_csv(
        self,
        csv_content: str,
        insee_code: str,
        price_min: int = 500000,
        price_max: int = 1200000,
        land_min_m2: int = 200,
    ) -> List[Dict[str, Any]]:
        """
        Parser le CSV et filtrer les propriétés selon les critères.

        Args:
            csv_content: Contenu du CSV en tant que string
            insee_code: Code INSEE pour identification
            price_min: Prix minimum (euros)
            price_max: Prix maximum (euros)
            land_min_m2: Surface minimale du terrain (m²)

        Returns:
            Liste des propriétés filtrées et dédupliquées
        """
        if not csv_content:
            return []

        filtered = []
        seen = set()  # Pour déduplication

        try:
            # Parser le CSV
            csv_reader = csv.DictReader(io.StringIO(csv_content))
            if not csv_reader.fieldnames:
                logger.warning(f"CSV vide ou invalide pour {insee_code}")
                return []

            for row in csv_reader:
                try:
                    # Vérifier les critères de base
                    nature = row.get("nature_mutation", "").strip()
                    type_local = row.get("type_local", "").strip()

                    if nature != "Vente" or type_local != "Maison":
                        continue

                    # Extraire et valider le prix
                    try:
                        price = int(float(row.get("valeur_fonciere", 0) or 0))
                    except (ValueError, TypeError):
                        continue

                    if not (price_min <= price <= price_max):
                        continue

                    # Extraire et valider la surface du terrain
                    try:
                        land_surface = int(float(row.get("surface_terrain", 0) or 0))
                    except (ValueError, TypeError):
                        land_surface = 0

                    if land_surface < land_min_m2:
                        continue

                    # Extraire les coordonnées (disponibles directement dans le CSV)
                    try:
                        lat = float(row.get("latitude", 0) or 0)
                        lon = float(row.get("longitude", 0) or 0)
                    except (ValueError, TypeError):
                        lat, lon = 0.0, 0.0

                    # Construire l'adresse
                    address_parts = []
                    if row.get("adresse_numero"):
                        address_parts.append(row.get("adresse_numero", ""))
                    if row.get("adresse_nom_voie"):
                        address_parts.append(row.get("adresse_nom_voie", ""))
                    address = " ".join(address_parts).strip()

                    # Clé de déduplication (adresse + prix)
                    dedup_key = f"{address}_{price}"
                    if dedup_key in seen:
                        continue
                    seen.add(dedup_key)

                    # Construire l'enregistrement
                    property_data = {
                        "address": address,
                        "city": row.get("nom_commune", "").strip(),
                        "postal_code": row.get("code_postal", "").strip(),
                        "price": price,
                        "land_surface_m2": land_surface,
                        "lat": lat,
                        "lon": lon,
                        "mutation_date": row.get("date_mutation", "").strip(),
                        "dvf_id": row.get("id_mutation", "").strip(),
                    }

                    filtered.append(property_data)

                except Exception as e:
                    logger.debug(f"Erreur parsing ligne pour {insee_code}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Erreur parsing CSV pour {insee_code}: {e}")
            return []

        logger.info(f"CSV {insee_code}: {len(filtered)} propriétés filtrées et dédupliquées")
        return filtered

    async def scrape_commune(
        self,
        dept_code: str,
        insee_code: str,
        price_min: int = 500000,
        price_max: int = 1200000,
        land_min_m2: int = 200,
        session: aiohttp.ClientSession = None,
    ) -> List[Dict[str, Any]]:
        """
        Scraper une commune complète (télécharger, parser, filtrer).

        Args:
            dept_code: Code du département
            insee_code: Code INSEE de la commune
            price_min: Prix minimum
            price_max: Prix maximum
            land_min_m2: Surface minimale du terrain
            session: Session aiohttp (crée une nouvelle si None)

        Returns:
            Liste des propriétés filtrées
        """
        if session is None:
            async with aiohttp.ClientSession() as new_session:
                csv_content = await self.download_commune_csv(dept_code, insee_code, new_session)
        else:
            csv_content = await self.download_commune_csv(dept_code, insee_code, session)

        return self.parse_and_filter_csv(csv_content, insee_code, price_min, price_max, land_min_m2)

    async def scan_communes(
        self,
        communes_by_dept: Dict[str, List[str]],
        price_min: int = 500000,
        price_max: int = 1200000,
        land_min_m2: int = 200,
    ) -> List[Dict[str, Any]]:
        """
        Scanner plusieurs communes (groupées par département).

        Args:
            communes_by_dept: Dict {dept_code: [insee_code1, insee_code2, ...]}
            price_min: Prix minimum
            price_max: Prix maximum
            land_min_m2: Surface minimale du terrain

        Returns:
            Liste complète des propriétés
        """
        all_properties = []

        async with aiohttp.ClientSession() as session:
            for dept_code, insee_codes in communes_by_dept.items():
                logger.info(f"Scan département {dept_code} ({len(insee_codes)} communes)")

                # Traiter par batch pour respecter le rate limiting
                for i in range(0, len(insee_codes), self.batch_size):
                    batch = insee_codes[i : i + self.batch_size]
                    tasks = [
                        self.scrape_commune(dept_code, insee, price_min, price_max, land_min_m2, session)
                        for insee in batch
                    ]
                    batch_results = await asyncio.gather(*tasks)
                    for results in batch_results:
                        all_properties.extend(results)

        logger.info(f"Total: {len(all_properties)} propriétés trouvées")
        return all_properties

    async def scan_idf(
        self,
        price_min: int = 500000,
        price_max: int = 1200000,
        land_min_m2: int = 200,
        meru_price_min: int = 200000,
        meru_price_max: int = 600000,
        meru_land_min_m2: int = 300,
    ) -> List[Dict[str, Any]]:
        """
        Scanner l'Île-de-France: Val-d'Oise (95) en priorité, puis 92, 93, et Méru (60).
        Méru utilise des seuils de prix plus bas (marché moins cher).

        Returns:
            Liste des propriétés IDF + Méru
        """
        logger.info("=== SCAN ÎLE-DE-FRANCE (95 PRIO + 92/93 + Méru 60) ===")
        all_properties = []

        # 1) Val-d'Oise en PRIORITÉ
        logger.info(">>> PRIORITÉ: Val-d'Oise (95)")
        vdo_props = await self.scan_communes(
            {"95": VALDOISE_COMMUNES},
            price_min, price_max, land_min_m2,
        )
        all_properties.extend(vdo_props)
        logger.info(f"Val-d'Oise: {len(vdo_props)} propriétés qualifiées")

        # 2) Hauts-de-Seine (92)
        logger.info(">>> Hauts-de-Seine (92)")
        hds_props = await self.scan_communes(
            {"92": HAUTSDESEINE_COMMUNES},
            price_min, price_max, land_min_m2,
        )
        all_properties.extend(hds_props)
        logger.info(f"Hauts-de-Seine: {len(hds_props)} propriétés qualifiées")

        # 3) Seine-Saint-Denis (93)
        logger.info(">>> Seine-Saint-Denis (93)")
        ssd_props = await self.scan_communes(
            {"93": SEINESAINTDENIS_COMMUNES},
            price_min, price_max, land_min_m2,
        )
        all_properties.extend(ssd_props)
        logger.info(f"Seine-Saint-Denis: {len(ssd_props)} propriétés qualifiées")

        # 4) Méru (60) — prix plus bas
        logger.info(">>> Méru (60) — seuils de prix ajustés")
        meru_props = await self.scan_communes(
            {"60": MERU_COMMUNES},
            meru_price_min, meru_price_max, meru_land_min_m2,
        )
        all_properties.extend(meru_props)
        logger.info(f"Méru: {len(meru_props)} propriétés qualifiées")

        logger.info(f"=== TOTAL IDF: {len(all_properties)} propriétés ===")
        return all_properties

    # Legacy alias
    async def scan_south_france(self, **kwargs) -> List[Dict[str, Any]]:
        """Redirige vers scan_idf (anciennement sud France)."""
        return await self.scan_idf(**kwargs)

    async def scan_department(
        self,
        department_code: str,
        price_min: int = 500000,
        price_max: int = 1200000,
        land_min_m2: int = 200,
    ) -> List[Dict[str, Any]]:
        """
        Scanner les communes d'un département.
        """
        communes = IDF_COMMUNES.get(department_code, MAJOR_CITIES_INSEE.get(department_code, []))
        if not communes:
            logger.warning(f"Département {department_code} non configuré")
            return []

        # Ajuster les prix pour Méru
        if department_code == "60":
            price_min = 200000
            price_max = 600000
            land_min_m2 = 300
            logger.info(f"Méru (60): seuils ajustés {price_min}-{price_max}€, terrain >{land_min_m2}m²")

        logger.info(f"Scan département {department_code} ({len(communes)} communes)")
        return await self.scan_communes(
            {department_code: communes},
            price_min,
            price_max,
            land_min_m2,
        )

