param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$GitArgs
)

$repoRoot = Split-Path $PSScriptRoot -Parent
& "$repoRoot/scripts/select-github-account.ps1" -Action commit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git commit @GitArgs
exit $LASTEXITCODE
