# build-config.ps1
# ============================================================
# Citizen Report - Config Generator
# Reads .env.local and injects values into www/js/config.js
# Run: powershell -ExecutionPolicy Bypass -File scripts/build-config.ps1
# ============================================================

$scriptDir   = Split-Path -Parent $PSCommandPath
$rootDir     = Split-Path -Parent $scriptDir
$envFile     = Join-Path $rootDir ".env.local"
$configFile  = Join-Path $rootDir "www\js\config.js"

if (!(Test-Path $envFile)) {
    Write-Host "WARNING: .env.local not found. Trying .env.example as fallback..." -ForegroundColor Yellow
    $envFile = Join-Path $rootDir ".env.example"
    if (!(Test-Path $envFile)) {
        Write-Error ".env.local not found. Create it from .env.example."
        exit 1
    }
}

# Parse key=value pairs (skip comments and blank lines)
$env = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and $line -notmatch '^#') {
        $parts = $line -split '=', 2
        if ($parts.Count -eq 2) {
            $env[$parts[0].Trim()] = $parts[1].Trim()
        }
    }
}

# Extract values with fallbacks (compatible with PowerShell 5)
function Get-EnvVal($key, $default) {
    if ($env.ContainsKey($key) -and $env[$key] -ne '') { return $env[$key] }
    return $default
}

$apiBaseUrl        = Get-EnvVal "WP_API_BASE_URL"            "https://sivvyboi-yvxpm-studio.wp.build"
$apiNamespace      = Get-EnvVal "WP_API_NAMESPACE"           "/wp-json/citizen-report/v1"
$googleWebClientId = Get-EnvVal "GOOGLE_WEB_CLIENT_ID"       ""
$googleAndroidId   = Get-EnvVal "GOOGLE_ANDROID_CLIENT_ID"   ""
$firebaseApiKey    = Get-EnvVal "FIREBASE_API_KEY"           ""
$firebaseAuthDomain = Get-EnvVal "FIREBASE_AUTH_DOMAIN"       ""
$firebaseProjectId = Get-EnvVal "FIREBASE_PROJECT_ID"        "citizen-report-studio"
$firebaseStorage   = Get-EnvVal "FIREBASE_STORAGE_BUCKET"    ""
$firebaseSenderId  = Get-EnvVal "FIREBASE_MESSAGING_SENDER_ID" "492822176724"
$firebaseAppId     = Get-EnvVal "FIREBASE_APP_ID"            ""

# Write config.js
$config = @"
/**
 * Citizen Report - Environment & API Configuration
 * AUTO-GENERATED from .env.local — Do not edit manually.
 * Regenerate by running: npm run build:config
 */

window.APP_CONFIG = {
  // WordPress backend
  API_BASE_URL: '$apiBaseUrl',
  API_NAMESPACE: '$apiNamespace',

  // Google OAuth credentials
  GOOGLE_WEB_CLIENT_ID: '$googleWebClientId',
  GOOGLE_ANDROID_CLIENT_ID: '$googleAndroidId',

  // Firebase Authentication configuration
  FIREBASE_CONFIG: {
    apiKey: '$firebaseApiKey',
    authDomain: '$firebaseAuthDomain',
    projectId: '$firebaseProjectId',
    storageBucket: '$firebaseStorage',
    messagingSenderId: '$firebaseSenderId',
    appId: '$firebaseAppId'
  },

  // Polling interval in ms
  POLL_INTERVAL_MS: 20000
};
"@

$config | Out-File -FilePath $configFile -Encoding UTF8 -NoNewline
Write-Host "config.js generated from .env.local" -ForegroundColor Green
Write-Host "  API:       $apiBaseUrl"
Write-Host "  Google ID: $googleWebClientId"
