@echo off
setlocal

echo.
echo  FX BRIEF - Daily Publish
echo  ========================
echo.

:: Settings
set REPO=%USERPROFILE%\OneDrive\Documentos\Claude Projects\Forex-Brief
set DOWNLOADS=%USERPROFILE%\Downloads

:: Get date using PowerShell
for /f %%a in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set TODAY=%%a
echo  Date: %TODAY%
echo.

:: Find newest index*.html in Downloads
for /f "delims=" %%F in ('powershell -NoProfile -Command "Get-ChildItem -Path '%DOWNLOADS%' -Filter 'index*.html' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName"') do set SNAP=%%F

if not defined SNAP (
    echo  ERROR: No index*.html in Downloads.
    echo  Hit SNAPSHOT in the dashboard first.
    pause
    exit /b 1
)
echo  Snapshot: %SNAP%

:: Copy to repo as index.html and dated file
copy /Y "%SNAP%" "%REPO%\index.html" >nul
copy /Y "%SNAP%" "%REPO%\%TODAY%.html" >nul
echo  Copied index.html and %TODAY%.html
echo.

:: Build archive.html using PowerShell
cd /d "%REPO%"
powershell -NoProfile -Command ^
  "$files = Get-ChildItem -Filter '????-??-??.html' | Sort-Object Name -Descending;" ^
  "$links = ($files | ForEach-Object { '<li><a href=""' + $_.Name + '"">' + $_.BaseName + '</a></li>' }) -join [char]10;" ^
  "$page = '<!DOCTYPE html><html lang=""en""><head><meta charset=""UTF-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1.0""><title>FX Brief Archive</title><link href=""https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap"" rel=""stylesheet""><style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#0a0b0d;color:#e8eaf0;font-family:IBM Plex Mono,monospace;padding:40px 24px;}h1{font-size:13px;font-weight:700;letter-spacing:0.2em;color:#3b82f6;margin-bottom:8px;}.sub{font-size:10px;color:#455060;margin-bottom:32px;}a.today{display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:3px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;margin-bottom:32px;}a.today:hover{background:#2563eb;}.sl{font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#455060;margin-bottom:12px;}ul{list-style:none;}ul li{border-bottom:1px solid rgba(255,255,255,0.055);}ul li a{display:block;padding:10px 0;font-size:12px;color:#8892a4;text-decoration:none;}ul li a:hover{color:#3b82f6;}.disc{font-size:10px;color:#455060;margin-top:40px;border-top:1px solid rgba(255,255,255,0.055);padding-top:16px;}</style></head><body><h1>FX / BRIEF</h1><div class=""sub"">TPTraders - Daily FX Intelligence - Not financial advice</div><a class=""today"" href=""index.html"">VIEW TODAY''S BRIEF</a><div class=""sl"">Archive</div><ul>' + $links + '</ul><div class=""disc"">FX Brief - TPTraders - Not financial advice</div></body></html>';" ^
  "Set-Content -Path 'archive.html' -Value $page -Encoding UTF8;" ^
  "Write-Host ('  Archive built: ' + $files.Count + ' entries')"

echo.

:: Push to GitHub
git add -A
git commit -m "brief %TODAY%"
git push

echo.
echo  Live at:
echo    https://cbell0920.github.io/forex-brief
echo    https://cbell0920.github.io/forex-brief/archive.html
echo.
pause
endlocal
