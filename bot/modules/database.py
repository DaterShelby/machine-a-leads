"""
Module de gestion de la base de données SQLite.
"""

import sqlite3
import csv
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Any
import logging

logger = logging.getLogger(__name__)


class Database:
    """Gestion de la base de données SQLite pour les leads."""

    def __init__(self, db_path: Path):
        """Initialiser la connexion à la base de données."""
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def get_connection(self) -> sqlite3.Connection:
        """Obtenir une connexion à la base de données."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self) -> None:
        """Initialiser la base de données avec les tables."""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Table properties
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS properties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                address TEXT NOT NULL,
                city TEXT NOT NULL,
                postal_code TEXT NOT NULL,
                lat REAL,
                lon REAL,
                price INTEGER NOT NULL,
                land_surface_m2 INTEGER,
                building_surface_m2 INTEGER,
                mutation_date TEXT,
                has_pool BOOLEAN DEFAULT 0,
                satellite_image_path TEXT,
                ai_image_path TEXT,
                status TEXT DEFAULT 'new',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                dvf_id TEXT UNIQUE
            )
        """
        )

        # Table emails
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                property_id INTEGER NOT NULL,
                sent_at TEXT,
                opened_at TEXT,
                clicked_at TEXT,
                replied_at TEXT,
                follow_up_count INTEGER DEFAULT 0,
                FOREIGN KEY(property_id) REFERENCES properties(id)
            )
        """
        )

        # Table pipeline_jobs
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS pipeline_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_type TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                started_at TEXT,
                completed_at TEXT,
                properties_processed INTEGER DEFAULT 0,
                errors INTEGER DEFAULT 0,
                log_summary TEXT
            )
        """
        )

        # Index pour améliorer les performances
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_postal_code ON properties(postal_code)"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_price ON properties(price)"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_status ON properties(status)"
        )

        conn.commit()
        conn.close()
        logger.info(f"Base de données initialisée: {self.db_path}")

    def add_property(
        self,
        address: str,
        city: str,
        postal_code: str,
        price: int,
        land_surface_m2: int,
        building_surface_m2: Optional[int] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        mutation_date: Optional[str] = None,
        dvf_id: Optional[str] = None,
    ) -> int:
        """Ajouter une propriété à la base de données."""
        conn = self.get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                """
                INSERT INTO properties
                (address, city, postal_code, price, land_surface_m2,
                 building_surface_m2, lat, lon, mutation_date, dvf_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    address,
                    city,
                    postal_code,
                    price,
                    land_surface_m2,
                    building_surface_m2,
                    lat,
                    lon,
                    mutation_date,
                    dvf_id,
                ),
            )
            conn.commit()
            property_id = cursor.lastrowid
            logger.debug(f"Propriété ajoutée: ID={property_id}, {address}")
            return property_id
        except sqlite3.IntegrityError:
            logger.warning(f"Propriété déjà existante (DVF ID: {dvf_id})")
            return None
        finally:
            conn.close()

    def get_property(self, property_id: int) -> Optional[Dict[str, Any]]:
        """Récupérer une propriété par ID."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM properties WHERE id = ?", (property_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    def get_all_properties(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Récupérer toutes les propriétés."""
        conn = self.get_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM properties ORDER BY created_at DESC"
        if limit:
            query += f" LIMIT {limit}"
        cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_properties_by_status(
        self, status: str, limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Récupérer les propriétés par statut."""
        conn = self.get_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM properties WHERE status = ? ORDER BY created_at DESC"
        if limit:
            query += f" LIMIT {limit}"
        cursor.execute(query, (status,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def update_property_status(self, property_id: int, status: str) -> None:
        """Mettre à jour le statut d'une propriété."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE properties SET status = ? WHERE id = ?", (status, property_id)
        )
        conn.commit()
        conn.close()
        logger.debug(f"Statut mis à jour: Property {property_id} -> {status}")

    def update_satellite_image(
        self, property_id: int, image_path: str
    ) -> None:
        """Mettre à jour le chemin de l'image satellite."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE properties SET satellite_image_path = ? WHERE id = ?",
            (image_path, property_id),
        )
        conn.commit()
        conn.close()

    def update_ai_image(self, property_id: int, image_path: str) -> None:
        """Mettre à jour le chemin de l'image IA."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE properties SET ai_image_path = ? WHERE id = ?",
            (image_path, property_id),
        )
        conn.commit()
        conn.close()

    def add_email(self, property_id: int) -> int:
        """Enregistrer un envoi d'email pour une propriété."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO emails (property_id, sent_at)
            VALUES (?, ?)
        """,
            (property_id, datetime.now().isoformat()),
        )
        conn.commit()
        email_id = cursor.lastrowid
        conn.close()
        return email_id

    def get_email_count(self, property_id: int) -> int:
        """Compter les emails envoyés pour une propriété."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM emails WHERE property_id = ?", (property_id,))
        count = cursor.fetchone()[0]
        conn.close()
        return count

    def create_pipeline_job(self, job_type: str) -> int:
        """Créer un nouveau job dans le pipeline."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO pipeline_jobs (job_type, status, started_at)
            VALUES (?, 'pending', ?)
        """,
            (job_type, datetime.now().isoformat()),
        )
        conn.commit()
        job_id = cursor.lastrowid
        conn.close()
        return job_id

    def update_pipeline_job(
        self,
        job_id: int,
        status: str,
        properties_processed: int = 0,
        errors: int = 0,
        log_summary: Optional[str] = None,
    ) -> None:
        """Mettre à jour un job du pipeline."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE pipeline_jobs
            SET status = ?, completed_at = ?,
                properties_processed = ?, errors = ?, log_summary = ?
            WHERE id = ?
        """,
            (
                status,
                datetime.now().isoformat() if status == "completed" else None,
                properties_processed,
                errors,
                log_summary,
                job_id,
            ),
        )
        conn.commit()
        conn.close()

    def get_statistics(self) -> Dict[str, Any]:
        """Obtenir des statistiques sur la base de données."""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM properties")
        total_properties = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM properties WHERE status = 'new'")
        new_properties = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM emails")
        total_emails = cursor.fetchone()[0]

        cursor.execute("SELECT AVG(price) FROM properties")
        avg_price = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT city) FROM properties")
        unique_cities = cursor.fetchone()[0]

        conn.close()

        return {
            "total_properties": total_properties,
            "new_properties": new_properties,
            "total_emails_sent": total_emails,
            "average_price": int(avg_price) if avg_price else 0,
            "unique_cities": unique_cities,
        }

    def export_csv(self, output_path: Path, status: Optional[str] = None) -> None:
        """Exporter les propriétés en CSV."""
        conn = self.get_connection()
        cursor = conn.cursor()

        if status:
            cursor.execute(
                "SELECT * FROM properties WHERE status = ? ORDER BY created_at DESC",
                (status,),
            )
        else:
            cursor.execute("SELECT * FROM properties ORDER BY created_at DESC")

        rows = cursor.fetchall()
        conn.close()

        if not rows:
            logger.warning("Aucune propriété à exporter")
            return

        keys = rows[0].keys()
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            for row in rows:
                writer.writerow(dict(row))

        logger.info(f"Export CSV: {len(rows)} propriétés -> {output_path}")

    def delete_all_properties(self) -> None:
        """Supprimer toutes les propriétés (utile pour tests)."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM properties")
        cursor.execute("DELETE FROM emails")
        conn.commit()
        conn.close()
        logger.warning("Toutes les propriétés ont été supprimées")
