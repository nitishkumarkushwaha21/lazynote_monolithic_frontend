param(
    [ValidateSet("commit", "push")]
    [string]$Action = "commit",
    [int]$Account = 0
)

$ErrorActionPreference = "Stop"
$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
    Write-Error "Not inside a git repository."
    exit 1
}

$accounts = & "$repoRoot/scripts/github-accounts.ps1"

function Get-AccountChoice {
    param([array]$AccountList, [string]$ActionName)

    Write-Host ""
    Write-Host "Choose GitHub account for git $ActionName :" -ForegroundColor Cyan
    for ($i = 0; $i -lt $AccountList.Count; $i++) {
        Write-Host "  $($i + 1)) $($AccountList[$i].Label)"
    }
    Write-Host ""

    $choicePath = Join-Path $env:WINDIR "System32\choice.exe"
    if (Test-Path $choicePath) {
        $keys = (1..$AccountList.Count) -join ""
        & $choicePath /C $keys /N /M "Enter choice (1-$($AccountList.Count))"
        $code = $LASTEXITCODE
        if ($code -ge 1 -and $code -le $AccountList.Count) {
            return $code
        }
    }

    if (-not [Console]::IsInputRedirected) {
        for ($attempt = 1; $attempt -le 3; $attempt++) {
            $choice = Read-Host "Enter choice (1-$($AccountList.Count))"
            if ($choice -match "^\d+$" -and [int]$choice -ge 1 -and [int]$choice -le $AccountList.Count) {
                return [int]$choice
            }
            Write-Host "Invalid choice. Try again." -ForegroundColor Yellow
        }
    }

    Write-Error @"
Could not read account choice.
Run manually: powershell -File scripts/select-github-account.ps1 -Action $ActionName -Account 1
"@
    exit 1
}

if ($Account -lt 1 -or $Account -gt $accounts.Count) {
    $Account = Get-AccountChoice -AccountList $accounts -ActionName $Action
}

$selected = $accounts[$Account - 1]
Write-Host "Using: $($selected.Label)" -ForegroundColor Green

git config user.name $selected.Name
git config user.email $selected.Email

if ($Action -eq "push") {
    $remoteUrl = git config --get remote.origin.url
    if (-not $remoteUrl) {
        Write-Error "No origin remote configured."
        exit 1
    }

    $normalized = $remoteUrl -replace "^https://[^@/]+@", "https://"
    $normalized = $normalized -replace "^git@github\.com:", "https://github.com/"
    if ($normalized -notmatch "^https://github\.com/") {
        Write-Error "Unsupported remote URL: $remoteUrl"
        exit 1
    }

    $pushUrl = $normalized -replace "^https://", "https://$($selected.Username)@"
    git remote set-url origin $pushUrl

    $cmdkeyOutput = cmdkey /list 2>&1 | Out-String
    $targets = [regex]::Matches($cmdkeyOutput, 'Target:\s*(LegacyGeneric:target=git:[^\r\n]+)') |
        ForEach-Object { $_.Groups[1].Value.Trim() } |
        Select-Object -Unique

    foreach ($target in $targets) {
        cmdkey /delete:$target 2>$null | Out-Null
    }

    Write-Host "Push will authenticate as $($selected.Username). Sign in if prompted." -ForegroundColor Yellow
}

exit 0
