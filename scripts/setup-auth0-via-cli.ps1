# Configures Husky-Review Auth0 tenant via Auth0 CLI (run after: auth0 login)
$ErrorActionPreference = "Stop"
# Auth0 CLI writes normal output to stderr; do not treat it as terminating errors.
$prevEap = $ErrorActionPreference
function Invoke-Auth0Cli {
  param([Parameter(Mandatory = $true)][string[]]$Auth0Args)
  $ErrorActionPreference = "Continue"
  $output = & $Auth0 @Auth0Args 2>&1 | ForEach-Object { "$_" }
  $script:LastAuth0ExitCode = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  return , $output
}
function Get-Auth0Json {
  param([Parameter(Mandatory = $true)][string[]]$Auth0Args)
  $lines = Invoke-Auth0Cli -Auth0Args $Auth0Args
  if ($script:LastAuth0ExitCode -ne 0) {
    throw "Auth0 CLI failed ($($Auth0Args -join ' ')), exit $script:LastAuth0ExitCode"
  }
  $text = ($lines | Out-String).Trim()
  $start = $text.IndexOf('[')
  if ($start -lt 0) { $start = $text.IndexOf('{') }
  if ($start -lt 0) {
    throw "Auth0 CLI returned no JSON for: $($Auth0Args -join ' ')"
  }
  return $text.Substring($start) | ConvertFrom-Json
}
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
$tenantList = Invoke-Auth0Cli -Auth0Args @("tenants", "list")
$tenantList | Out-String | Write-Host
if ($script:LastAuth0ExitCode -ne 0) {
  Write-Host ""
  Write-Host "Not logged in. Run:"
  Write-Host "  .\.tools\auth0-cli\auth0.exe login"
  Write-Host "Then re-run: npm run auth0:setup:cli"
  exit 1
}

Write-Host "Updating SPA client $clientId ..."
Invoke-Auth0Cli -Auth0Args @(
  "apps", "update", $clientId,
  "--callbacks", $callbacks,
  "--logout-urls", $logout,
  "--origins", $origins,
  "--web-origins", $origins
) | Out-Null
if ($script:LastAuth0ExitCode -ne 0) { exit $script:LastAuth0ExitCode }

$actionPath = Join-Path $Root "auth0\actions\post-login-uw-google.js"
$actionNames = @("Google + @uw.edu", "Husky-Review UW Google Post-Login")

Write-Host "Ensuring post-login Action..."
$existing = Get-Auth0Json -Auth0Args @("actions", "list", "--json")
$action = $existing | Where-Object { $actionNames -contains $_.name } | Select-Object -First 1
$actionName = if ($action) { $action.name } else { $actionNames[0] }
$actionCode = Get-Content $actionPath -Raw

if (-not $action) {
  Invoke-Auth0Cli -Auth0Args @(
    "--no-input", "actions", "create",
    "--name", $actionName,
    "--trigger", "post-login",
    "--code", $actionCode,
    "--runtime", "node22"
  ) | Out-Host
  if ($script:LastAuth0ExitCode -ne 0) { exit $script:LastAuth0ExitCode }
  $existing = Get-Auth0Json -Auth0Args @("actions", "list", "--json")
  $action = $existing | Where-Object { $actionNames -contains $_.name } | Select-Object -First 1
  if (-not $action) {
    Write-Error "Post-login Action was created but could not be found in actions list."
  }
} else {
  Invoke-Auth0Cli -Auth0Args @(
    "--no-input", "actions", "update", $action.id,
    "--name", $actionName,
    "--code", $actionCode,
    "--runtime", "node22",
    "--force"
  ) | Out-Host
  if ($script:LastAuth0ExitCode -ne 0) { exit $script:LastAuth0ExitCode }
}

Invoke-Auth0Cli -Auth0Args @("--no-input", "actions", "deploy", $action.id) | Out-Host
if ($script:LastAuth0ExitCode -ne 0) { exit $script:LastAuth0ExitCode }

Write-Host "Setting SPA token endpoint auth to none (public client)..."
$patchFile = Join-Path $Root "scripts\auth0-spa-patch.json"
$ErrorActionPreference = "Continue"
Get-Content $patchFile -Raw | & $Auth0 api patch "clients/$clientId" 2>&1 | Out-Null
$ErrorActionPreference = $prevEap
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to patch SPA token settings. See scripts/auth0-spa-patch.json"
}

Write-Host ""
Write-Host "Auth0 CLI setup finished. Confirm Google-only connection is enabled for this app in the Auth0 Dashboard."
Write-Host "  Applications -> $($clientId) -> Connections -> enable only Google"
