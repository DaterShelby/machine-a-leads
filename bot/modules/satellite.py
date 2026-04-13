"""
Module pour récupérer les images satellites des propriétés.
"""

import asyncio
import aiohttp
import logging
from pathlib import Path
from typing import Optional
from io import BytesIO

logger = logging.getLogger(__name__)


class SatelliteModule:
    """Module pour télécharger les images satellites."""

    def __init__(
        self,
        google_maps_api_key: Optional[str] = None,
        mapbox_api_key: Optional[str] = None,
        image_size: int = 640,
        zoom: int = 19,
    ):
        """Initialiser le module images satellites."""
        self.google_maps_api_key = google_maps_api_key
        self.mapbox_api_key = mapbox_api_key
        self.image_size = image_size
        self.zoom = zoom

    async def fetch_from_google_maps(
        self, lat: float, lon: float, session: aiohttp.ClientSession
    ) -> Optional[bytes]:
        """
        Télécharger une image satellite via Google Maps Static API.

        Args:
            lat: Latitude
            lon: Longitude
            session: Session aiohttp

        Returns:
            Bytes de l'image ou None
        """
        if not self.google_maps_api_key:
            logger.warning("Google Maps API key manquante, impossible de télécharger")
            return None

        url = "https://maps.googleapis.com/maps/api/staticmap"
        params = {
            "center": f"{lat},{lon}",
            "zoom": self.zoom,
            "size": f"{self.image_size}x{self.image_size}",
            "maptype": "satellite",
            "key": self.google_maps_api_key,
        }

        try:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.read()
                else:
                    logger.warning(
                        f"Google Maps error: status {response.status} for {lat},{lon}"
                    )
                    return None
        except Exception as e:
            logger.error(f"Erreur Google Maps: {e}")
            return None

    async def fetch_from_mapbox(
        self, lat: float, lon: float, session: aiohttp.ClientSession
    ) -> Optional[bytes]:
        """
        Télécharger une image satellite via Mapbox Static API.

        Args:
            lat: Latitude
            lon: Longitude
            session: Session aiohttp

        Returns:
            Bytes de l'image ou None
        """
        if not self.mapbox_api_key:
            logger.warning("Mapbox API key manquante, impossible de télécharger")
            return None

        url = f"https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/{lon},{lat},{self.zoom}/{self.image_size}x{self.image_size}"
        params = {
            "access_token": self.mapbox_api_key,
        }

        try:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.read()
                else:
                    logger.warning(
                        f"Mapbox error: status {response.status} for {lat},{lon}"
                    )
                    return None
        except Exception as e:
            logger.error(f"Erreur Mapbox: {e}")
            return None

    async def fetch_satellite_image(
        self,
        lat: float,
        lon: float,
        property_id: int,
        output_dir: Path,
        session: aiohttp.ClientSession,
    ) -> Optional[Path]:
        """
        Télécharger une image satellite (Google ou Mapbox).

        Args:
            lat: Latitude
            lon: Longitude
            property_id: ID de la propriété
            output_dir: Répertoire de sortie
            session: Session aiohttp

        Returns:
            Chemin du fichier ou None en cas d'erreur
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{property_id}_before.jpg"

        # Essayer Google Maps d'abord
        if self.google_maps_api_key:
            logger.info(f"Récupération image satellite via Google Maps: {lat},{lon}")
            image_data = await self.fetch_from_google_maps(lat, lon, session)

            if image_data:
                with open(output_path, "wb") as f:
                    f.write(image_data)
                logger.info(f"Image satellite sauvegardée: {output_path}")
                return output_path
            else:
                logger.warning(
                    "Google Maps échoué, tentative Mapbox..."
                )

        # Fallback sur Mapbox
        if self.mapbox_api_key:
            logger.info(f"Récupération image satellite via Mapbox: {lat},{lon}")
            image_data = await self.fetch_from_mapbox(lat, lon, session)

            if image_data:
                with open(output_path, "wb") as f:
                    f.write(image_data)
                logger.info(f"Image satellite sauvegardée: {output_path}")
                return output_path

        # Aucune clé API disponible
        logger.warning(
            f"Impossible de télécharger image satellite (aucune clé API): {lat},{lon}"
        )
        return None

    async def fetch_batch(
        self,
        properties: list,
        output_dir: Path,
        session: aiohttp.ClientSession,
    ) -> dict:
        """
        Télécharger les images pour un batch de propriétés.

        Args:
            properties: Liste des propriétés avec lat/lon
            output_dir: Répertoire de sortie
            session: Session aiohttp

        Returns:
            Dict {property_id: image_path}
        """
        results = {}

        for prop in properties:
            if not prop.get("lat") or not prop.get("lon"):
                logger.warning(f"Coordonnées manquantes pour propriété {prop.get('id')}")
                continue

            try:
                image_path = await self.fetch_satellite_image(
                    prop["lat"],
                    prop["lon"],
                    prop["id"],
                    output_dir,
                    session,
                )
                if image_path:
                    results[prop["id"]] = str(image_path)

                await asyncio.sleep(1.0)  # Rate limiting

            except Exception as e:
                logger.error(f"Erreur téléchargement image {prop.get('id')}: {e}")

        return results
