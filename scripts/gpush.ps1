param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$GitArgs
)

$repoRoot = Split-Path $PSScriptRoot -Parent
& "$repoRoot/scripts/select-github-account.ps1" -Action push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git push @GitArgs
exit $LASTEXITCODE
