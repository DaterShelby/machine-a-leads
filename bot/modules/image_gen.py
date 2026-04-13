"""
Module de génération d'images IA (avant/après piscine).
"""

import asyncio
import aiohttp
import logging
from pathlib import Path
from typing import Optional
import base64

logger = logging.getLogger(__name__)


class ImageGenModule:
    """Module pour générer les images IA de piscines."""

    def __init__(self, stability_ai_api_key: Optional[str] = None):
        """Initialiser le module génération IA."""
        self.stability_ai_api_key = stability_ai_api_key
        self.engine_id = "stable-diffusion-xl-1024-v1-0"
        self.api_host = "https://api.stability.ai"

    async def generate_pool_image(
        self,
        input_image_path: Path,
        property_id: int,
        output_dir: Path,
        session: aiohttp.ClientSession,
    ) -> Optional[Path]:
        """
        Générer une image IA de piscine via Stability AI.

        Args:
            input_image_path: Chemin de l'image satellite
            property_id: ID de la propriété
            output_dir: Répertoire de sortie
            session: Session aiohttp

        Returns:
            Chemin du fichier ou None
        """
        if not self.stability_ai_api_key:
            logger.warning("Stability AI key manquante, impossible de générer l'image")
            return None

        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{property_id}_after.jpg"

        # Vérifier que l'image d'entrée existe
        if not input_image_path.exists():
            logger.warning(
                f"Image d'entrée non trouvée: {input_image_path}"
            )
            return None

        try:
            # Lire l'image en base64
            with open(input_image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")

            logger.info(f"Génération IA image de piscine pour propriété {property_id}")

            # Créer la requête multipart
            url = f"{self.api_host}/v1/generation/{self.engine_id}/image-to-image"

            # Préparer les données
            data = {
                "init_image": image_data,
                "text_prompts": [
                    {
                        "text": (
                            "Aerial satellite view of a backyard with a modern rectangular "
                            "swimming pool with turquoise water, stone decking, realistic shadows, "
                            "photorealistic, 4K"
                        ),
                        "weight": 1,
                    }
                ],
                "image_strength": 0.35,
                "step_schedule_start": 0.6,
                "steps": 20,
                "cfg_scale": 7.5,
                "samples": 1,
            }

            headers = {
                "Authorization": f"Bearer {self.stability_ai_api_key}",
                "Accept": "application/json",
            }

            async with session.post(
                url,
                json=data,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=120),
            ) as response:
                if response.status == 200:
                    result = await response.json()

                    if "artifacts" in result and len(result["artifacts"]) > 0:
                        # Décoder et sauvegarder l'image
                        image_bytes = base64.b64decode(result["artifacts"][0]["base64"])
                        with open(output_path, "wb") as f:
                            f.write(image_bytes)

                        logger.info(f"Image IA générée: {output_path}")
                        return output_path
                else:
                    logger.warning(
                        f"Stability AI error: status {response.status}"
                    )
                    error_text = await response.text()
                    logger.warning(f"Response: {error_text}")
                    return None

        except asyncio.TimeoutError:
            logger.error("Timeout lors de la génération IA")
            return None
        except Exception as e:
            logger.error(f"Erreur génération IA: {e}")
            return None

    async def generate_batch(
        self,
        properties: list,
        output_dir: Path,
        session: aiohttp.ClientSession,
    ) -> dict:
        """
        Générer les images IA pour un batch de propriétés.

        Args:
            properties: Liste des propriétés avec image satellite
            output_dir: Répertoire de sortie
            session: Session aiohttp

        Returns:
            Dict {property_id: image_path}
        """
        results = {}

        for prop in properties:
            if not prop.get("satellite_image_path"):
                logger.warning(
                    f"Image satellite manquante pour propriété {prop.get('id')}"
                )
                continue

            try:
                image_path = await self.generate_pool_image(
                    Path(prop["satellite_image_path"]),
                    prop["id"],
                    output_dir,
                    session,
                )

                if image_path:
                    results[prop["id"]] = str(image_path)

                await asyncio.sleep(2.0)  # Rate limiting (API premium)

            except Exception as e:
                logger.error(f"Erreur génération image {prop.get('id')}: {e}")

        return results
