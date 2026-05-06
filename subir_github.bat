@echo off
:: Habilitar rutas largas y subir al repo
git config --global core.longpaths true

set TOKEN=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
set USUARIO=ingnelsonruiz
set REPO=AUTOMATIZACI-N-LIMPIEZA-CARTERA

echo Iniciando subida...

git init
git config user.email "profesionaldesistemas1@dusakawiepsi.com"
git config user.name "Nelson Javier"
git config core.longpaths true
git add .
git commit -m "feat: Automatizacion Limpieza Cartera - Dusakawi EPS v2.0"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://%TOKEN%@github.com/%USUARIO%/%REPO%.git
git push -u origin main --force

echo.
echo Listo! Repo: https://github.com/%USUARIO%/%REPO%
pause