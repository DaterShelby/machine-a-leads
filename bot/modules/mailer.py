"""
Module pour l'envoi d'emails personnalisés via Brevo.
"""

import asyncio
import aiohttp
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import json

logger = logging.getLogger(__name__)


class MailerModule:
    """Module pour envoyer les emails de présentation de piscines."""

    def __init__(
        self,
        brevo_api_key: Optional[str] = None,
        sender_email: str = "contact@machinealeads.fr",
        sender_name: str = "Machine à Leads",
    ):
        """Initialiser le module email."""
        self.brevo_api_key = brevo_api_key
        self.sender_email = sender_email
        self.sender_name = sender_name
        self.brevo_api_base = "https://api.brevo.com/v3"

    def generate_email_html(
        self,
        property_address: str,
        property_city: str,
        before_image_url: Optional[str] = None,
        after_image_url: Optional[str] = None,
    ) -> str:
        """
        Générer le HTML de l'email.

        Args:
            property_address: Adresse de la propriété
            property_city: Ville
            before_image_url: URL de l'image avant (optionnel)
            after_image_url: URL de l'image après (optionnel)

        Returns:
            HTML de l'email
        """
        html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Votre future piscine</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f5f5f5;
        }}
        .container {{
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            margin: 20px;
        }}
        .header {{
            text-align: center;
            border-bottom: 3px solid #0099ff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .header h1 {{
            color: #0099ff;
            margin: 0;
            font-size: 28px;
        }}
        .property-info {{
            background-color: #f9f9f9;
            padding: 15px;
            border-left: 4px solid #0099ff;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .property-info p {{
            margin: 5px 0;
            font-size: 16px;
        }}
        .property-info strong {{
            color: #0099ff;
        }}
        .images {{
            margin: 30px 0;
            text-align: center;
        }}
        .image-pair {{
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
            margin: 20px 0;
        }}
        .image-container {{
            flex: 1;
            min-width: 250px;
            max-width: 280px;
        }}
        .image-container img {{
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }}
        .image-label {{
            font-size: 14px;
            color: #666;
            margin-top: 10px;
            font-weight: bold;
        }}
        .cta {{
            text-align: center;
            margin: 30px 0;
        }}
        .cta-button {{
            display: inline-block;
            background-color: #0099ff;
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            transition: background-color 0.3s;
        }}
        .cta-button:hover {{
            background-color: #0077cc;
        }}
        .benefits {{
            background-color: #f0f8ff;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }}
        .benefits h3 {{
            color: #0099ff;
            margin-top: 0;
        }}
        .benefits ul {{
            margin: 10px 0;
            padding-left: 25px;
        }}
        .benefits li {{
            margin: 8px 0;
        }}
        .footer {{
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            margin-top: 30px;
            font-size: 12px;
            color: #999;
        }}
        .unsubscribe {{
            text-align: center;
            font-size: 11px;
            color: #ccc;
            margin-top: 20px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 Votre future piscine</h1>
            <p>Une présentation personnalisée pour votre propriété</p>
        </div>

        <div class="property-info">
            <p><strong>Adresse:</strong> {property_address}</p>
            <p><strong>Ville:</strong> {property_city}</p>
        </div>

        <h2 style="color: #0099ff; text-align: center;">Avant & Après</h2>
        <div class="images">
            <div class="image-pair">
"""

        if before_image_url:
            html += f"""                <div class="image-container">
                    <img src="{before_image_url}" alt="État actuel">
                    <div class="image-label">État actuel</div>
                </div>
"""

        if after_image_url:
            html += f"""                <div class="image-container">
                    <img src="{after_image_url}" alt="Avec votre future piscine">
                    <div class="image-label">Avec votre future piscine</div>
                </div>
"""

        html += """            </div>
        </div>

        <div class="benefits">
            <h3>Les avantages d'une piscine</h3>
            <ul>
                <li>💰 Augmentation de la valeur de votre bien de 5 à 15%</li>
                <li>😎 Loisirs en famille et entre amis</li>
                <li>🏋️ Activité physique régulière et douce</li>
                <li>🌤️ Profitez de l'été au maximum</li>
                <li>✨ Design moderne et contemporain</li>
            </ul>
        </div>

        <div class="cta">
            <a href="https://machinealeads.fr/devis?address={property_address.replace(' ', '%20')}" class="cta-button">
                ✓ Je veux un devis gratuit
            </a>
        </div>

        <p style="text-align: center; font-size: 14px; color: #666;">
            Nos experts piscinistes vous proposeront des solutions adaptées à votre budget
            et à votre terrain, sans engagement.
        </p>

        <div class="footer">
            <p>
                Cet email vous est adressé car votre propriété correspond aux critères
                de nos partenaires piscinistes.
            </p>
            <div class="unsubscribe">
                <p>
                    <a href="https://machinealeads.fr/unsubscribe" style="color: #ccc; text-decoration: none;">
                        Se désinscrire | RGPD
                    </a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>"""
        return html

    async def send_email(
        self,
        recipient_email: str,
        recipient_name: str,
        property_address: str,
        property_city: str,
        before_image_url: Optional[str] = None,
        after_image_url: Optional[str] = None,
        session: Optional[aiohttp.ClientSession] = None,
    ) -> bool:
        """
        Envoyer un email personnalisé.

        Args:
            recipient_email: Email du destinataire
            recipient_name: Nom du destinataire
            property_address: Adresse de la propriété
            property_city: Ville
            before_image_url: URL de l'image avant (optionnel)
            after_image_url: URL de l'image après (optionnel)
            session: Session aiohttp (optionnel)

        Returns:
            True si succès, False sinon
        """
        if not self.brevo_api_key:
            logger.warning(
                f"Brevo key manquante. Email sauvegardé en draft local pour {recipient_email}"
            )
            self._save_draft_email(
                recipient_email,
                recipient_name,
                property_address,
                property_city,
                before_image_url,
                after_image_url,
            )
            return False

        html_body = self.generate_email_html(
            property_address, property_city, before_image_url, after_image_url
        )

        payload = {
            "sender": {"email": self.sender_email, "name": self.sender_name},
            "to": [{"email": recipient_email, "name": recipient_name}],
            "subject": f"🏠 Votre future piscine - {property_address}",
            "htmlContent": html_body,
            "tags": ["leads", "piscine", "prospection"],
        }

        headers = {
            "api-key": self.brevo_api_key,
            "Content-Type": "application/json",
        }

        try:
            if session is None:
                async with aiohttp.ClientSession() as local_session:
                    async with local_session.post(
                        f"{self.brevo_api_base}/smtp/email",
                        json=payload,
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=30),
                    ) as response:
                        if response.status == 201:
                            logger.info(f"Email envoyé à {recipient_email}")
                            return True
                        else:
                            error_text = await response.text()
                            logger.error(
                                f"Brevo error {response.status}: {error_text}"
                            )
                            return False
            else:
                async with session.post(
                    f"{self.brevo_api_base}/smtp/email",
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as response:
                    if response.status == 201:
                        logger.info(f"Email envoyé à {recipient_email}")
                        return True
                    else:
                        error_text = await response.text()
                        logger.error(f"Brevo error {response.status}: {error_text}")
                        return False

        except asyncio.TimeoutError:
            logger.error(f"Timeout envoi email à {recipient_email}")
            return False
        except Exception as e:
            logger.error(f"Erreur envoi email à {recipient_email}: {e}")
            return False

    def _save_draft_email(
        self,
        recipient_email: str,
        recipient_name: str,
        property_address: str,
        property_city: str,
        before_image_url: Optional[str] = None,
        after_image_url: Optional[str] = None,
    ) -> None:
        """Sauvegarder un brouillon d'email en local."""
        draft_dir = Path(__file__).parent.parent / "data" / "email_drafts"
        draft_dir.mkdir(parents=True, exist_ok=True)

        # Générer le HTML
        html_body = self.generate_email_html(
            property_address, property_city, before_image_url, after_image_url
        )

        # Sauvegarder en fichier
        safe_email = recipient_email.replace("@", "_at_").replace(".", "_")
        draft_path = (
            draft_dir / f"draft_{safe_email}_{property_address[:30].replace(' ', '_')}.html"
        )

        with open(draft_path, "w", encoding="utf-8") as f:
            f.write(html_body)

        logger.info(f"Email sauvegardé en draft: {draft_path}")

    async def send_batch(
        self,
        emails_data: list,
        session: Optional[aiohttp.ClientSession] = None,
    ) -> Dict[str, bool]:
        """
        Envoyer les emails pour un batch de propriétés.

        Args:
            emails_data: Liste des dictionnaires avec les données d'email
            session: Session aiohttp (optionnel)

        Returns:
            Dict {property_id: success}
        """
        results = {}

        for email_info in emails_data:
            try:
                success = await self.send_email(
                    email_info["recipient_email"],
                    email_info.get("recipient_name", "Propriétaire"),
                    email_info["property_address"],
                    email_info["property_city"],
                    email_info.get("before_image_url"),
                    email_info.get("after_image_url"),
                    session,
                )
                results[email_info.get("property_id")] = success

                await asyncio.sleep(0.5)  # Rate limiting

            except Exception as e:
                logger.error(f"Erreur envoi email batch: {e}")
                results[email_info.get("property_id")] = False

        return results
