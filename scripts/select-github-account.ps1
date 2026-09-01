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

if ($Account -lt 1 -or $Account -gt $accounts.Count) {
    Write-Host ""
    Write-Host "Choose GitHub account for git $Action :" -ForegroundColor Cyan
    for ($i = 0; $i -lt $accounts.Count; $i++) {
        Write-Host "  $($i + 1)) $($accounts[$i].Label)"
    }
    Write-Host ""

    $choice = Read-Host "Enter choice (1-$($accounts.Count))"
    if ($choice -notmatch "^\d+$" -or [int]$choice -lt 1 -or [int]$choice -gt $accounts.Count) {
        Write-Error "Invalid choice. Use: .\scripts\gcommit.ps1 or .\scripts\gpush.ps1"
        exit 1
    }
    $Account = [int]$choice
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
