Write-Host "=== WanderStreet - Pushing to GitHub ===" -ForegroundColor Cyan
Set-Location "C:\Users\variy\Documents\wanderstreet"
git remote set-url origin https://github.com/Hoppiplus/wanderstreet.git
Write-Host "Pushing to GitHub... A browser window will open to authorize." -ForegroundColor Yellow
git push -u origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n SUCCESS! Code is live at: https://github.com/Hoppiplus/wanderstreet" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. cd C:\Users\variy\Documents\wanderstreet" -ForegroundColor White
    Write-Host "  2. npm install" -ForegroundColor White
    Write-Host "  3. npm run dev  -> opens at http://localhost:3000" -ForegroundColor White
} else {
    Write-Host "`nPush failed. Try running: git push -u origin main" -ForegroundColor Red
}
Write-Host "`nPress any key to close..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
