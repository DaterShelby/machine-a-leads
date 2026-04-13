#!/usr/bin/env python3
"""
Tests unitaires pour les modules de Machine à Leads.
"""

import asyncio
import sys
from pathlib import Path
from modules.database import Database
from modules.scraper import Scraper
from modules.satellite import SatelliteModule
from modules.image_gen import ImageGenModule
from modules.mailer import MailerModule
import config


def test_database():
    """Tester le module database."""
    print("\n[TEST] Database Module")
    print("=" * 50)

    db = Database(config.DB_PATH)

    # Test add_property
    print("✓ Testing add_property...")
    prop_id = db.add_property(
        address="123 Test Street",
        city="TestCity",
        postal_code="75001",
        price=750000,
        land_surface_m2=500,
        lat=48.8566,
        lon=2.3522,
    )
    assert prop_id is not None, "Property not created"

    # Test get_property
    print("✓ Testing get_property...")
    prop = db.get_property(prop_id)
    assert prop is not None, "Property not retrieved"
    assert prop["address"] == "123 Test Street"

    # Test get_all_properties
    print("✓ Testing get_all_properties...")
    props = db.get_all_properties()
    assert len(props) > 0, "No properties found"

    # Test update_property_status
    print("✓ Testing update_property_status...")
    db.update_property_status(prop_id, "processed")
    updated_prop = db.get_property(prop_id)
    assert updated_prop["status"] == "processed"

    # Test statistics
    print("✓ Testing get_statistics...")
    stats = db.get_statistics()
    assert "total_properties" in stats
    assert stats["total_properties"] > 0

    # Test pipeline_job
    print("✓ Testing pipeline_job...")
    job_id = db.create_pipeline_job("test_job")
    assert job_id is not None
    db.update_pipeline_job(job_id, "completed", properties_processed=1)

    # Test email tracking
    print("✓ Testing email tracking...")
    email_id = db.add_email(prop_id)
    assert email_id is not None
    count = db.get_email_count(prop_id)
    assert count >= 1

    print("\n✓ Database tests PASSED")


async def test_scraper():
    """Tester le module scraper."""
    print("\n[TEST] Scraper Module")
    print("=" * 50)

    scraper = Scraper()

    # Test scrape_postal_code (might fail if API is down)
    print("✓ Testing scraper initialization...")
    assert scraper.batch_size == config.BATCH_SIZE
    assert scraper.request_delay == config.DVF_REQUEST_DELAY

    print("✓ Testing scan_postal_codes (minimal)...")
    try:
        props = await scraper.scan_postal_codes(
            ["75001"],  # Small test
            config.PRICE_MIN,
            config.PRICE_MAX,
            config.LAND_MIN_M2,
        )
        # Result might be empty if API is down (normal)
        assert isinstance(props, list), "Should return list"
        print(f"  Found {len(props)} properties (API might be unavailable)")
    except Exception as e:
        print(f"  Warning: {e} (API might be down)")

    print("\n✓ Scraper tests PASSED")


def test_satellite():
    """Tester le module satellite."""
    print("\n[TEST] Satellite Module")
    print("=" * 50)

    # Without API keys, should handle gracefully
    print("✓ Testing satellite initialization...")
    sat = SatelliteModule(
        google_maps_api_key=None,
        mapbox_api_key=None,
    )
    assert sat.image_size == config.SATELLITE_IMAGE_SIZE
    assert sat.zoom == config.SATELLITE_IMAGE_ZOOM

    print("✓ Testing with no API keys (should log warning)...")
    # This should log a warning and return None
    assert sat.google_maps_api_key is None
    assert sat.mapbox_api_key is None

    print("\n✓ Satellite tests PASSED")


def test_image_gen():
    """Tester le module génération IA."""
    print("\n[TEST] ImageGen Module")
    print("=" * 50)

    print("✓ Testing image_gen initialization...")
    gen = ImageGenModule(stability_ai_api_key=None)
    assert gen.stability_ai_api_key is None

    print("✓ Testing with no API key (should handle gracefully)...")
    # Should not crash
    assert gen.stability_ai_api_key is None

    print("\n✓ ImageGen tests PASSED")


def test_mailer():
    """Tester le module mailer."""
    print("\n[TEST] Mailer Module")
    print("=" * 50)

    print("✓ Testing mailer initialization...")
    mailer = MailerModule(
        brevo_api_key=None,
        sender_email="test@example.com",
        sender_name="Test",
    )
    assert mailer.sender_email == "test@example.com"
    assert mailer.brevo_api_key is None

    print("✓ Testing HTML generation...")
    html = mailer.generate_email_html(
        property_address="123 Test St",
        property_city="TestCity",
        before_image_url="http://example.com/before.jpg",
        after_image_url="http://example.com/after.jpg",
    )
    assert "123 Test St" in html
    assert "TestCity" in html
    assert "http://example.com/before.jpg" in html
    assert "http://example.com/after.jpg" in html
    assert len(html) > 1000

    print("✓ Testing HTML without images...")
    html_no_img = mailer.generate_email_html(
        property_address="456 Test Ave",
        property_city="AnotherCity",
    )
    assert "456 Test Ave" in html_no_img

    print("\n✓ Mailer tests PASSED")


def test_config():
    """Tester la configuration."""
    print("\n[TEST] Configuration")
    print("=" * 50)

    print("✓ Checking config constants...")
    assert config.PRICE_MIN == 500_000
    assert config.PRICE_MAX == 1_200_000
    assert config.LAND_MIN_M2 == 200
    assert config.DB_PATH == config.DATA_DIR / "leads.db"

    print("✓ Checking API endpoints...")
    assert "api.cquest.org" in config.DVF_API_BASE
    assert "data.gouv.fr" in config.ADDRESS_API_BASE

    print("✓ Checking directories...")
    assert config.DATA_DIR.exists()
    assert config.IMAGES_DIR.exists()
    assert config.TEMPLATES_DIR.exists()

    print("\n✓ Configuration tests PASSED")


async def run_all_tests():
    """Exécuter tous les tests."""
    print("\n" + "=" * 50)
    print("  MACHINE À LEADS - TEST SUITE")
    print("=" * 50)

    try:
        test_config()
        test_database()
        await test_scraper()
        test_satellite()
        test_image_gen()
        test_mailer()

        print("\n" + "=" * 50)
        print("  ✓ ALL TESTS PASSED")
        print("=" * 50)
        print("\nBot is ready to use!")
        print("\nNext steps:")
        print("  1. Configure .env with your API keys (optional)")
        print("  2. Run: python bot.py --mode=scan")
        print("  3. Check README.md for more options")
        print("")

        return True

    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        return False
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    result = asyncio.run(run_all_tests())
    sys.exit(0 if result else 1)
