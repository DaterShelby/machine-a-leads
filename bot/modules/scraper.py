"""
Module de scraping des données DVF (Demandes de Valeurs Foncières).
"""

import asyncio
import aiohttp
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime
import time

logger = logging.getLogger(__name__)


class Scraper:
    """Scraper pour récupérer les données DVF."""

    def __init__(self, batch_size: int = 10, request_delay: float = 0.5):
        """Initialiser le scraper."""
        self.batch_size = batch_size
        self.request_delay = request_delay
        self.dvf_api_base = "https://api.cquest.org/dvf"
        self.address_api_base = "https://api-adresse.data.gouv.fr"

    async def scrape_postal_code(
        self,
        postal_code: str,
        price_min: int,
        price_max: int,
        land_min_m2: int,
        session: aiohttp.ClientSession,
    ) -> List[Dict[str, Any]]:
        """
        Scraper les propriétés d'un code postal via l'API DVF.

        Args:
            postal_code: Code postal à scanner (ex: "75001")
            price_min: Prix minimum en euros
            price_max: Prix maximum en euros
            land_min_m2: Surface minimale du terrain en m²
            session: Session aiohttp

        Returns:
            Liste des propriétés correspondantes
        """
        await asyncio.sleep(self.request_delay)

        params = {
            "code_postal": postal_code,
            "nature_mutation": "Vente",
            "type_local": "Maison",
        }

        try:
            async with session.get(
                f"{self.dvf_api_base}",
                params=params,
                timeout=aiohttp.ClientTimeout(total=30),
            ) as response:
                if response.status != 200:
                    logger.warning(
                        f"DVF API error for {postal_code}: status {response.status}"
                    )
                    return []

                data = await response.json()
                features = data.get("features", [])
                logger.info(
                    f"DVF: {len(features)} propriétés trouvées pour {postal_code}"
                )

                # Filtrer les propriétés
                filtered = []
                for feature in features:
                    props = feature.get("properties", {})

                    # Vérifier les critères de prix et surface
                    price = props.get("valeur_fonciere")
                    land_surface = props.get("surface_terrain")

                    if not price or not land_surface:
                        continue

                    price = int(price)
                    land_surface = int(land_surface)

                    if price_min <= price <= price_max and land_surface >= land_min_m2:
                        # Enrichir les données
                        property_data = {
                            "address": props.get("adresse_numero", "")
                            + " "
                            + props.get("adresse_suffixe", "")
                            + " "
                            + props.get("adresse_nom_voie", ""),
                            "city": props.get("commune_nom", ""),
                            "postal_code": postal_code,
                            "price": price,
                            "land_surface_m2": land_surface,
                            "building_surface_m2": props.get("surface_bati"),
                            "mutation_date": props.get("date_mutation"),
                            "dvf_id": f"{props.get('id_mutation')}_{postal_code}",
                            "lat": None,
                            "lon": None,
                        }
                        filtered.append(property_data)

                logger.debug(
                    f"DVF: {len(filtered)} propriétés correspondant aux critères pour {postal_code}"
                )
                return filtered

        except asyncio.TimeoutError:
            logger.error(f"Timeout DVF pour {postal_code}")
            return []
        except Exception as e:
            logger.error(f"Erreur DVF pour {postal_code}: {e}")
            return []

    async def enrich_coordinates(
        self,
        properties: List[Dict[str, Any]],
        session: aiohttp.ClientSession,
    ) -> List[Dict[str, Any]]:
        """
        Enrichir les propriétés avec les coordonnées GPS.

        Args:
            properties: Liste des propriétés
            session: Session aiohttp

        Returns:
            Liste des propriétés enrichies
        """
        enriched = []
        for prop in properties:
            await asyncio.sleep(0.3)  # Rate limiting

            address = f"{prop['address']}, {prop['postal_code']} {prop['city']}"

            try:
                async with session.get(
                    f"{self.address_api_base}/search",
                    params={"q": address, "limit": 1},
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("features"):
                            coords = data["features"][0]["geometry"]["coordinates"]
                            prop["lon"] = coords[0]
                            prop["lat"] = coords[1]
                            logger.debug(f"Coordonnées trouvées: {address}")

            except Exception as e:
                logger.warning(f"Erreur geocoding pour {address}: {e}")

            enriched.append(prop)

        return enriched

    async def scan_postal_codes(
        self,
        postal_codes: List[str],
        price_min: int,
        price_max: int,
        land_min_m2: int,
    ) -> List[Dict[str, Any]]:
        """
        Scanner plusieurs codes postaux.

        Args:
            postal_codes: Liste des codes postaux à scanner
            price_min: Prix minimum
            price_max: Prix maximum
            land_min_m2: Surface minimale du terrain

        Returns:
            Liste complète des propriétés
        """
        all_properties = []

        async with aiohttp.ClientSession() as session:
            # Phase 1: Scraper DVF
            logger.info(f"Démarrage du scan DVF pour {len(postal_codes)} codes postaux")

            for i in range(0, len(postal_codes), self.batch_size):
                batch = postal_codes[i : i + self.batch_size]
                tasks = [
                    self.scrape_postal_code(
                        cp, price_min, price_max, land_min_m2, session
                    )
                    for cp in batch
                ]
                batch_results = await asyncio.gather(*tasks)
                for results in batch_results:
                    all_properties.extend(results)

            logger.info(f"Total: {len(all_properties)} propriétés trouvées")

            # Phase 2: Enrichir avec GPS
            logger.info("Enrichissement des coordonnées GPS...")
            all_properties = await self.enrich_coordinates(all_properties, session)

        return all_properties

    async def scan_department(
        self,
        department_code: str,
        price_min: int,
        price_max: int,
        land_min_m2: int,
    ) -> List[Dict[str, Any]]:
        """
        Scanner tous les codes postaux d'un département.

        Args:
            department_code: Code du département (ex: "75", "92")
            price_min: Prix minimum
            price_max: Prix maximum
            land_min_m2: Surface minimale du terrain

        Returns:
            Liste des propriétés
        """
        # Générer les codes postaux du département
        # Format: département + 3 chiffres (001-999)
        postal_codes = [f"{department_code}{str(i).zfill(3)}" for i in range(1, 100)]

        logger.info(
            f"Scanning département {department_code} ({len(postal_codes)} codes postaux potentiels)"
        )
        return await self.scan_postal_codes(
            postal_codes, price_min, price_max, land_min_m2
        )

    async def scan_all_france(
        self, price_min: int, price_max: int, land_min_m2: int
    ) -> List[Dict[str, Any]]:
        """
        Scanner toute la France (tous les départements).

        Note: C'est un scan très long. Préférer scan_department pour des zones spécifiques.

        Args:
            price_min: Prix minimum
            price_max: Prix maximum
            land_min_m2: Surface minimale du terrain

        Returns:
            Liste des propriétés
        """
        # Tous les codes de département métropolitains + DOM-TOM
        departments = [
            "01",
            "02",
            "03",
            "04",
            "05",
            "06",
            "07",
            "08",
            "09",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16",
            "17",
            "18",
            "19",
            "21",
            "22",
            "23",
            "24",
            "25",
            "26",
            "27",
            "28",
            "29",
            "2A",
            "2B",
            "30",
            "31",
            "32",
            "33",
            "34",
            "35",
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45",
            "46",
            "47",
            "48",
            "49",
            "50",
            "51",
            "52",
            "53",
            "54",
            "55",
            "56",
            "57",
            "58",
            "59",
            "60",
            "61",
            "62",
            "63",
            "64",
            "65",
            "66",
            "67",
            "68",
            "69",
            "70",
            "71",
            "72",
            "73",
            "74",
            "75",
            "76",
            "77",
            "78",
            "79",
            "80",
            "81",
            "82",
            "83",
            "84",
            "85",
            "86",
            "87",
            "88",
            "89",
            "90",
            "91",
            "92",
            "93",
            "94",
            "95",
            "971",
            "972",
            "973",
            "974",
            "976",
        ]

        all_properties = []
        for dept in departments:
            props = await self.scan_department(dept, price_min, price_max, land_min_m2)
            all_properties.extend(props)

        return all_properties
