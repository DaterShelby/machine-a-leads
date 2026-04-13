#!/bin/bash
# Machine à Leads - Quickstart Script

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    Machine à Leads - Quickstart Setup                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check Python version
echo "✓ Vérification de Python..."
if ! command -v python3 &> /dev/null; then
    echo "✗ Python3 n'est pas installé"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo "  Python version: $PYTHON_VERSION"

# Install dependencies
echo ""
echo "✓ Installation des dépendances..."
pip install -q -r requirements.txt
echo "  OK"

# Create .env if not exists
echo ""
echo "✓ Configuration d'environnement..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "  .env créé (remplir avec vos clés API si nécessaire)"
else
    echo "  .env existe déjà"
fi

# Initialize database
echo ""
echo "✓ Initialisation base de données..."
python3 -c "
from modules.database import Database
from pathlib import Path
import config

db = Database(config.DB_PATH)
stats = db.get_statistics()
print(f'  Base de données prête: {stats[\"total_properties\"]} propriétés en base')
"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✓ SETUP COMPLÉTÉ                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Commandes disponibles:"
echo ""
echo "  Scraping DVF (sans clé API nécessaire):"
echo "    python bot.py --mode=scan"
echo "    python bot.py --mode=scan --codes 75001 75002 92100"
echo ""
echo "  Test mode (5 propriétés):"
echo "    python bot.py --mode=test"
echo ""
echo "  Full pipeline (scan + images + emails):"
echo "    python bot.py --mode=run"
echo ""
echo "  Afficher les stats:"
echo "    python bot.py --stats"
echo ""
echo "Documentation: Voir README.md"
echo ""
