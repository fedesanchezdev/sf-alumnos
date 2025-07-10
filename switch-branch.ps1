# Script para cambio rápido entre ramas y configuración de desarrollo
# Uso: .\switch-branch.ps1 [main|dev]

param(
    [string]$Branch = "dev"
)

Write-Host "🔄 Cambiando a rama $Branch..." -ForegroundColor Cyan

# Verificar si estamos en un repositorio git
if (-not (Test-Path .git)) {
    Write-Host "❌ No estás en un repositorio git" -ForegroundColor Red
    exit 1
}

# Guardar cambios si los hay
$status = git status --porcelain
if ($status) {
    Write-Host "📦 Guardando cambios actuales..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git stash push -m "Auto-stash antes de cambio de rama $timestamp"
}

# Cambiar a la rama
try {
    git checkout $Branch
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al cambiar a la rama $Branch" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error al cambiar a la rama $Branch" -ForegroundColor Red
    exit 1
}

# Actualizar rama
Write-Host "🔄 Actualizando rama desde origin..." -ForegroundColor Cyan
git pull origin $Branch

Write-Host "✅ Ahora estás en la rama $Branch" -ForegroundColor Green

# Mostrar último commit
Write-Host "`n📋 Último commit:" -ForegroundColor Cyan
git log --oneline -1

# Si es dev, mostrar si hay algo para mergear desde main
if ($Branch -eq "dev") {
    Write-Host "`n🔍 Verificando si hay actualizaciones en main..." -ForegroundColor Cyan
    git fetch origin main
    
    $behind = git rev-list --count HEAD..origin/main
    if ([int]$behind -gt 0) {
        Write-Host "⚠️  La rama dev está $behind commits atrás de main" -ForegroundColor Yellow
        Write-Host "💡 Considera hacer: git merge origin/main" -ForegroundColor Blue
    } else {
        Write-Host "✅ Dev está actualizada con main" -ForegroundColor Green
    }
}

# Si es main, advertir sobre desarrollo
if ($Branch -eq "main") {
    Write-Host "`n⚠️  ATENCIÓN: Estás en la rama de PRODUCCIÓN" -ForegroundColor Red
    Write-Host "💡 Para desarrollo, usa: .\switch-branch.ps1 dev" -ForegroundColor Blue
}

Write-Host "`n🚀 Listo para trabajar en $Branch!" -ForegroundColor Green
