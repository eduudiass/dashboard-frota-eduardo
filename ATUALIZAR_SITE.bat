@echo off
echo ========================================
echo   FleetManager - Atualizando dados
echo ========================================
echo.
cd /d "C:\Users\Eduardo Dias\Downloads\dashboard-frota-eduardo"
echo [1/3] Gerando dados.json...
python atualizar.py
echo.
echo [2/3] Commitando...
git add -A
git commit -m "atualizar dados"
echo.
echo [3/3] Enviando pro GitHub...
git push
echo.
echo ========================================
echo   PRONTO! Site atualizado.
echo ========================================
pause
