# Configures Husky-Review Auth0 tenant via Auth0 CLI (run after: auth0 login)
$ErrorActionPreference = "Stop"
# Auth0 CLI writes normal output to stderr; do not treat it as terminating errors.
$prevEap = $ErrorActionPreference
$Root = Split-Path -Parent $PSScriptRoot
$Auth0 = Join-Path $Root ".tools\auth0-cli\auth0.exe"

if (-not (Test-Path $Auth0)) {
  Write-Error "Auth0 CLI not found at $Auth0. Re-download from GitHub releases or run npm run auth0:setup with M2M credentials."
}

# Load .env.local
$envFile = Join-Path $Root ".env.local"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      $name = $matches[1]
      $value = $matches[2].Trim().Trim('"')
      if ($value -and -not [string]::IsNullOrWhiteSpace($value)) {
        Set-Item -Path "env:$name" -Value $value
      }
    }
  }
}

$clientId = $env:VITE_AUTH0_CLIENT_ID
if (-not $clientId) {
  Write-Error "VITE_AUTH0_CLIENT_ID missing from .env.local"
}

$production = if ($env:AUTH0_PRODUCTION_URL) { $env:AUTH0_PRODUCTION_URL } else { "https://husky-review.vercel.app" }
$local = if ($env:AUTH0_LOCAL_ORIGIN) { $env:AUTH0_LOCAL_ORIGIN } else { "http://localhost:5173" }

$callbacks = "$local/app,$production/app,https://*.vercel.app/app"
$origins = "$local,$production,https://*.vercel.app"
$logout = "$local,$production,https://*.vercel.app"

Write-Host "Checking Auth0 CLI session..."
$ErrorActionPreference = "Continue"
$tenantList = & $Auth0 tenants list 2>&1
$ErrorActionPreference = $prevEap
$tenantList | Out-String | Write-Host
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Not logged in. Run:"
  Write-Host "  .\.tools\auth0-cli\auth0.exe login"
  Write-Host "Then re-run: npm run auth0:setup:cli"
  exit 1
}

Write-Host "Updating SPA client $clientId ..."
& $Auth0 apps update $clientId `
  --callbacks $callbacks `
  --logout-urls $logout `
  --origins $origins `
  --web-origins $origins

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$actionPath = Join-Path $Root "auth0\actions\post-login-uw-google.js"
$actionName = "Husky-Review UW Google Post-Login"

Write-Host "Ensuring post-login Action..."
$existing = & $Auth0 actions list --json 2>$null | ConvertFrom-Json
$action = $existing | Where-Object { $_.name -eq $actionName } | Select-Object -First 1

if (-not $action) {
  & $Auth0 actions create `
    --name $actionName `
    --trigger post-login `
    --code "$(Get-Content $actionPath -Raw)" `
    --runtime node22 `
    --deploy `
    --yes
} else {
  & $Auth0 actions update $action.id `
    --name $actionName `
    --code "$(Get-Content $actionPath -Raw)" `
    --deploy `
    --yes
}

Write-Host "Setting SPA token endpoint auth to none (public client)..."
$patchFile = Join-Path $Root "scripts\auth0-spa-patch.json"
Get-Content $patchFile -Raw | & $Auth0 api patch "clients/$clientId" | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to patch SPA token settings. See scripts/auth0-spa-patch.json"
}

Write-Host ""
Write-Host "Auth0 CLI setup finished. Confirm Google-only connection is enabled for this app in the Auth0 Dashboard."
Write-Host "  Applications -> $($clientId) -> Connections -> enable only Google"
