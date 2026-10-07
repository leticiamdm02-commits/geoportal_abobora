@echo off
chcp 65001 >nul
title Geoportal WebGIS - Bacia do Ribeirão Abóbora
color 0B

echo ===================================================================
echo     GEOPORTAL INTERATIVO - BACIA DO RIBEIRÃO ABÓBORA (WEBGIS)
echo ===================================================================
echo.
echo  Iniciando aplicação WebGIS...
echo.

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Python detectado no sistema.
    echo  [OK] Iniciando servidor local e abrindo o navegador...
    python "%~dp0server.py"
) else (
    echo  [!] Python não encontrado no PATH.
    echo  [OK] Abrindo diretamente no navegador padrão...
    start "" "%~dp0index.html"
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  Houve um erro ao inicializar. Abrindo o arquivo HTML diretamente...
    start "" "%~dp0index.html"
    pause
)
