# Uruchom w PowerShell jako Administrator (prawy przycisk -> Uruchom jako administrator).
# Otwiera port 8081 w Windows Firewall — telefon w Wi-Fi / hotspot iPhone.

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdmin) {
    Write-Host "BLAD: Uruchom PowerShell jako Administrator." -ForegroundColor Red
    exit 1
}

$ruleName = "Backend API 8081 (mobile dev)"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
    Remove-NetFirewallRule -DisplayName $ruleName
    Write-Host "Usunieto stara regule: $ruleName"
}

try {
    # Hotspot iPhone w Windows często ma profil Public.
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Private, Public, Domain -ErrorAction Stop | Out-Null
    Write-Host "OK: Port 8081 otwarty (Private + Public + Domain)." -ForegroundColor Green
    exit 0
}
catch {
    Write-Host "BLAD: Nie udalo sie dodac reguly zapory: $_" -ForegroundColor Red
    exit 1
}
