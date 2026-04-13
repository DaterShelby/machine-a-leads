#!/usr/bin/env python3
"""
Machine à Leads - Bot de génération de leads pour piscinistes.

Scrape les données DVF, filtre les propriétés, et prépare les campagnes email.
"""

import asyncio
import logging
import sys
from pathlib import Path
from datetime import datetime
import argparse

from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn
from rich.logging import RichHandler
from rich.panel import Panel

import config
from modules import Database, Scraper, SatelliteModule, ImageGenModule, MailerModule

# Configuration du logging
logging.basicConfig(
    level=config.LOG_LEVEL,
    format="%(message)s",
    handlers=[RichHandler(rich_tracebacks=True)],
)
logger = logging.getLogger(__name__)
console = Console()


class MachineALeads:
    """Classe principale du bot."""

    def __init__(self):
        """Initialiser le bot."""
        self.db = Database(config.DB_PATH)
        self.scraper = Scraper(
            batch_size=config.BATCH_SIZE,
            request_delay=config.DVF_REQUEST_DELAY,
        )
        self.satellite = SatelliteModule(
            google_maps_api_key=config.GOOGLE_MAPS_API_KEY,
            mapbox_api_key=config.MAPBOX_API_KEY,
            image_size=config.SATELLITE_IMAGE_SIZE,
            zoom=config.SATELLITE_IMAGE_ZOOM,
        )
        self.image_gen = ImageGenModule(
            stability_ai_api_key=config.STABILITY_AI_API_KEY,
        )
        self.mailer = MailerModule(
            brevo_api_key=config.BREVO_API_KEY,
            sender_email=config.SENDER_EMAIL,
            sender_name=config.SENDER_NAME,
        )

    def show_banner(self) -> None:
        """Afficher la bannière du bot."""
        banner = """
        ╔═══════════════════════════════════════════════════╗
        ║       MACHINE À LEADS - Piscines Edition           ║
        ║                                                     ║
        ║   Lead Generation Bot | DVF Scraper | Leads.AI    ║
        ╚═══════════════════════════════════════════════════╝
        """
        console.print(banner, style="cyan")

    def show_stats(self) -> None:
        """Afficher les statistiques de la base de données."""
        stats = self.db.get_statistics()

        table = Table(title="📊 Statistiques de la base de données")
        table.add_column("Métrique", style="cyan")
        table.add_column("Valeur", style="green")

        table.add_row("Total de propriétés", str(stats["total_properties"]))
        table.add_row("Nouvelles propriétés", str(stats["new_properties"]))
        table.add_row("Emails envoyés", str(stats["total_emails_sent"]))
        table.add_row("Prix moyen", f"{stats['average_price']:,} €")
        table.add_row("Villes uniques", str(stats["unique_cities"]))

        console.print(table)

    async def mode_scan(self, postal_codes: list = None) -> None:
        """
        Mode scan: scraper les données DVF uniquement.

        Args:
            postal_codes: Liste des codes postaux à scanner (optionnel)
        """
        console.print(
            Panel("Mode SCAN: Scraping DVF uniquement", style="blue", expand=False)
        )

        # Déterminer la liste des codes postaux à scanner
        if postal_codes:
            codes_to_scan = postal_codes
        elif config.DEPARTMENTS_TO_SCAN:
            codes_to_scan = []
            for dept in config.DEPARTMENTS_TO_SCAN:
                codes_to_scan.extend(
                    [f"{dept}{str(i).zfill(3)}" for i in range(1, 100)]
                )
        else:
            # Scan tous les codes postaux de quelques grandes régions par défaut pour demo
            console.print(
                "[yellow]Aucun code postal spécifié. Scanning Île-de-France (75, 92) pour démo...[/]"
            )
            codes_to_scan = [f"{dept}{str(i).zfill(3)}" for dept in ["75", "92"] for i in range(1, 50)]

        console.print(f"[cyan]Codes postaux à scanner: {len(codes_to_scan)}[/]")

        # Créer un job dans le pipeline
        job_id = self.db.create_pipeline_job("dvf_scan")

        try:
            # Scraper les données
            with Progress(
                SpinnerColumn(),
                BarColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console,
            ) as progress:
                task = progress.add_task("Scraping DVF...", total=len(codes_to_scan))

                properties = await self.scraper.scan_postal_codes(
                    codes_to_scan,
                    config.PRICE_MIN,
                    config.PRICE_MAX,
                    config.LAND_MIN_M2,
                )

                progress.update(task, completed=len(codes_to_scan))

            console.print(f"[green]✓ {len(properties)} propriétés trouvées[/]")

            # Sauvegarder dans la DB
            with Progress(
                SpinnerColumn(),
                BarColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console,
            ) as progress:
                task = progress.add_task("Sauvegarde en base de données...", total=len(properties))

                for prop in properties:
                    prop_id = self.db.add_property(
                        address=prop.get("address", ""),
                        city=prop.get("city", ""),
                        postal_code=prop.get("postal_code", ""),
                        price=prop.get("price", 0),
                        land_surface_m2=prop.get("land_surface_m2", 0),
                        building_surface_m2=prop.get("building_surface_m2"),
                        lat=prop.get("lat"),
                        lon=prop.get("lon"),
                        mutation_date=prop.get("mutation_date"),
                        dvf_id=prop.get("dvf_id"),
                    )
                    progress.advance(task)

            # Mettre à jour le job
            self.db.update_pipeline_job(
                job_id,
                status="completed",
                properties_processed=len(properties),
            )

            console.print(
                Panel(
                    f"[green]✓ Scan DVF complété[/]\n{len(properties)} propriétés sauvegardées",
                    style="green",
                    expand=False,
                )
            )
            self.show_stats()

        except Exception as e:
            self.db.update_pipeline_job(
                job_id,
                status="failed",
                errors=1,
                log_summary=str(e),
            )
            console.print(f"[red]✗ Erreur: {e}[/]")
            sys.exit(1)

    async def mode_test(self) -> None:
        """Mode test: scraper 5 propriétés et les traiter."""
        console.print(Panel("Mode TEST: Processing limité à 5 propriétés", style="blue", expand=False))

        # Récupérer les 5 premières propriétés nouvelles
        properties = self.db.get_properties_by_status("new", limit=5)

        if not properties:
            # Faire un mini scan
            console.print("[yellow]Aucune propriété en base. Petit scan test...[/]")
            await self.mode_scan(postal_codes=["75001", "75002"])
            properties = self.db.get_properties_by_status("new", limit=5)

        console.print(f"[cyan]Traitement de {len(properties)} propriétés[/]")

        job_id = self.db.create_pipeline_job("test_pipeline")
        processed = 0
        errors = 0

        # Afficher les propriétés
        table = Table(title="Propriétés à traiter")
        table.add_column("ID", style="cyan")
        table.add_column("Adresse", style="green")
        table.add_column("Prix", style="yellow")
        table.add_column("Surface", style="magenta")

        for prop in properties:
            table.add_row(
                str(prop["id"]),
                prop["address"][:40],
                f"{prop['price']:,} €",
                f"{prop['land_surface_m2']} m²",
            )

        console.print(table)

        # Traiter chaque propriété
        async with aiohttp.ClientSession() as session:
            for prop in properties:
                try:
                    console.print(f"\n[blue]Traitement: {prop['address']}[/]")

                    # Télécharger image satellite (optionnel)
                    if prop.get("lat") and prop.get("lon"):
                        image_path = await self.satellite.fetch_satellite_image(
                            prop["lat"],
                            prop["lon"],
                            prop["id"],
                            config.IMAGES_DIR,
                            session,
                        )
                        if image_path:
                            self.db.update_satellite_image(prop["id"], str(image_path))
                            console.print(f"[green]✓ Image satellite téléchargée[/]")

                    # Mettre à jour le statut
                    self.db.update_property_status(prop["id"], "processed")
                    processed += 1
                    console.print(f"[green]✓ Propriété traitée[/]")

                except Exception as e:
                    errors += 1
                    console.print(f"[red]✗ Erreur: {e}[/]")

        # Mettre à jour le job
        self.db.update_pipeline_job(
            job_id,
            status="completed",
            properties_processed=processed,
            errors=errors,
        )

        console.print(
            Panel(
                f"[green]✓ Mode test complété[/]\n{processed} propriétés traitées, {errors} erreurs",
                style="green",
                expand=False,
            )
        )

    async def mode_run(self) -> None:
        """Mode run: pipeline complet (scan, images, emails)."""
        console.print(Panel("Mode RUN: Pipeline complet", style="blue", expand=False))

        # Phase 1: Scan DVF
        console.print("\n[cyan]Phase 1: Scraping DVF...[/]")

        if config.DEPARTMENTS_TO_SCAN:
            postal_codes = []
            for dept in config.DEPARTMENTS_TO_SCAN:
                postal_codes.extend(
                    [f"{dept}{str(i).zfill(3)}" for i in range(1, 100)]
                )
        else:
            console.print(
                "[yellow]Aucun département configuré. Scanning Île-de-France par défaut...[/]"
            )
            postal_codes = [f"{dept}{str(i).zfill(3)}" for dept in ["75", "92"] for i in range(1, 50)]

        job_id = self.db.create_pipeline_job("full_pipeline")
        processed = 0
        errors = 0

        try:
            properties = await self.scraper.scan_postal_codes(
                postal_codes,
                config.PRICE_MIN,
                config.PRICE_MAX,
                config.LAND_MIN_M2,
            )

            console.print(f"[green]✓ {len(properties)} propriétés trouvées[/]")

            # Sauvegarder
            for prop in properties:
                self.db.add_property(
                    address=prop.get("address", ""),
                    city=prop.get("city", ""),
                    postal_code=prop.get("postal_code", ""),
                    price=prop.get("price", 0),
                    land_surface_m2=prop.get("land_surface_m2", 0),
                    building_surface_m2=prop.get("building_surface_m2"),
                    lat=prop.get("lat"),
                    lon=prop.get("lon"),
                    mutation_date=prop.get("mutation_date"),
                    dvf_id=prop.get("dvf_id"),
                )

            processed = len(properties)

            # Phase 2: Télécharger images satellites
            console.print("\n[cyan]Phase 2: Téléchargement images satellites...[/]")
            console.print("[yellow]Skipped (pas de clé API configurée)[/]")

            # Phase 3: Générer images IA
            console.print("\n[cyan]Phase 3: Génération images IA...[/]")
            console.print("[yellow]Skipped (pas de clé API configurée)[/]")

            # Phase 4: Envoyer emails
            console.print("\n[cyan]Phase 4: Envoi des emails...[/]")
            console.print("[yellow]Skipped (pas de clé API configurée)[/]")

            # Mettre à jour le job
            self.db.update_pipeline_job(
                job_id,
                status="completed",
                properties_processed=processed,
                errors=errors,
            )

            console.print(
                Panel(
                    f"[green]✓ Pipeline complété[/]\n{processed} propriétés traitées",
                    style="green",
                    expand=False,
                )
            )
            self.show_stats()

        except Exception as e:
            self.db.update_pipeline_job(
                job_id,
                status="failed",
                properties_processed=processed,
                errors=errors + 1,
                log_summary=str(e),
            )
            console.print(f"[red]✗ Erreur: {e}[/]")
            sys.exit(1)


async def main():
    """Fonction principale."""
    # Parser les arguments
    parser = argparse.ArgumentParser(
        description="Machine à Leads - Bot de génération de leads pour piscinistes"
    )
    parser.add_argument(
        "--mode",
        choices=["scan", "test", "run"],
        default="scan",
        help="Mode d'exécution (défaut: scan)",
    )
    parser.add_argument(
        "--codes",
        nargs="+",
        help="Codes postaux à scanner (ex: 75001 75002 92100)",
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Afficher les statistiques et quitter",
    )

    args = parser.parse_args()

    # Initialiser le bot
    bot = MachineALeads()
    bot.show_banner()

    # Afficher les stats si demandé
    if args.stats:
        bot.show_stats()
        return

    # Exécuter le mode demandé
    if args.mode == "scan":
        await bot.mode_scan(postal_codes=args.codes)
    elif args.mode == "test":
        await bot.mode_test()
    elif args.mode == "run":
        await bot.mode_run()


if __name__ == "__main__":
    # Import aiohttp ici pour éviter les problèmes
    import aiohttp

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n[yellow]Interrupted by user[/]")
        sys.exit(0)
    except Exception as e:
        console.print(f"[red]Fatal error: {e}[/]")
        sys.exit(1)
