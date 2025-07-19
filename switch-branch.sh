#!/bin/bash

# Script para cambio rápido entre ramas y configuración de desarrollo
# Uso: ./switch-branch.sh [main|dev]

BRANCH=${1:-dev}

echo "🔄 Cambiando a rama $BRANCH..."

# Guardar cambios si los hay
if [ -n "$(git status --porcelain)" ]; then
    echo "📦 Guardando cambios actuales..."
    git stash push -m "Auto-stash antes de cambio de rama $(date)"
fi

# Cambiar a la rama
git checkout $BRANCH

# Actualizar rama
git pull origin $BRANCH

echo "✅ Ahora estás en la rama $BRANCH"

# Mostrar último commit
echo "📋 Último commit:"
git log --oneline -1

# Si es dev, mostrar si hay algo para mergear desde main
if [ "$BRANCH" = "dev" ]; then
    echo ""
    echo "🔍 Verificando si hay actualizaciones en main..."
    git fetch origin main
    BEHIND=$(git rev-list --count HEAD..origin/main)
    if [ $BEHIND -gt 0 ]; then
        echo "⚠️  La rama dev está $BEHIND commits atrás de main"
        echo "💡 Considera hacer: git merge origin/main"
    else
        echo "✅ Dev está actualizada con main"
    fi
fi

# Si es main, advertir sobre desarrollo
if [ "$BRANCH" = "main" ]; then
    echo ""
    echo "⚠️  ATENCIÓN: Estás en la rama de PRODUCCIÓN"
    echo "💡 Para desarrollo, usa: ./switch-branch.sh dev"
fi
