@echo off
echo.
echo  FX BRIEF - Daily Publish
echo  ========================
echo.

set REPO=%USERPROFILE%\OneDrive\Documentos\Claude Projects\Forex-Brief
set DOWNLOADS=%USERPROFILE%\Downloads

:: Get today's date using PowerShell (reliable cross-version)
for /f "delims=" %%D in ('powershell -nologo -command "Get-Date -Format yyyy-MM-dd"') do set DATED=%%D
echo  Date: %DATED%
echo.

:: Find newest index*.html in Downloads
for /f "delims=" %%F in ('powershell -nologo -command "Get-ChildItem '%DOWNLOADS%\index*.html' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName 2>$null"') do set NEWEST_INDEX=%%F

if "%NEWEST_INDEX%"=="" (
    echo  ERROR: No index*.html found in Downloads.
    echo  Hit the SNAPSHOT button in the dashboard first.
    echo.
    pause
    exit /b 1
)

echo  Found snapshot: %NEWEST_INDEX%

:: Copy index.html to repo
copy /Y "%NEWEST_INDEX%" "%REPO%\index.html"
echo  Copied as index.html

:: Also copy as dated file
copy /Y "%NEWEST_INDEX%" "%REPO%\%DATED%.html"
echo  Copied as %DATED%.html
echo.

:: Build archive page
cd /d "%REPO%"
powershell -nologo -command ^
  "$files = Get-ChildItem '????-??-??.html' | Sort-Object Name -Descending; " ^
  "$links = ''; " ^
  "foreach ($f in $files) { $d = $f.BaseName; $links += '<li><a href=""' + $f.Name + '"">'+$d+'</a></li>' + [char]10 }; " ^
  "$html = '<!DOCTYPE html><html lang=""en""><head><meta charset=""UTF-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1.0""><title>FX Brief Archive</title><link href=""https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap"" rel=""stylesheet""><style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#0a0b0d;color:#e8eaf0;font-family:IBM Plex Mono,monospace;padding:40px 24px;}h1{font-size:13px;font-weight:700;letter-spacing:0.2em;color:#3b82f6;margin-bottom:8px;}.sub{font-size:10px;color:#455060;margin-bottom:32px;}a.today{display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:3px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;margin-bottom:32px;}a.today:hover{background:#2563eb;}.sl{font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#455060;margin-bottom:12px;}ul{list-style:none;}ul li{border-bottom:1px solid rgba(255,255,255,0.055);}ul li a{display:block;padding:10px 0;font-size:12px;color:#8892a4;text-decoration:none;}ul li a:hover{color:#3b82f6;}.disc{font-size:10px;color:#455060;margin-top:40px;border-top:1px solid rgba(255,255,255,0.055);padding-top:16px;}</style></head><body><h1>FX / BRIEF</h1><div class=""sub"">TPTraders - Daily FX Intelligence - Not financial advice</div><a class=""today"" href=""index.html"">VIEW TODAY''S BRIEF</a><div class=""sl"">Archive</div><ul>' + $links + '</ul><div class=""disc"">FX Brief - TPTraders - Not financial advice</div></body></html>'; " ^
  "Set-Content -Path 'archive.html' -Value $html -Encoding UTF8; " ^
  "Write-Host '  Archive page built with' $files.Count 'entries.'"

echo.

:: Git push
git add -A
git commit -m "brief %DATED%"
git push

echo.
echo  Published:
echo    https://cbell0920.github.io/forex-brief
echo    https://cbell0920.github.io/forex-brief/%DATED%.html
echo    https://cbell0920.github.io/forex-brief/archive.html
echo.
pause
