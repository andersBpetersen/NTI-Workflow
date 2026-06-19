param(
    [string]$RegistryHost = "",

    [Parameter(Mandatory = $true)]
    [string]$Namespace,

    [Parameter(Mandatory = $true)]
    [string]$ImageName,

    [Parameter(Mandatory = $true)]
    [string]$Version,

    [switch]$AlsoLatest
)

# Build, tag og push NTI Workflow Docker image til et registry.
# Docker Hub: udelad -RegistryHost og brug -Namespace "tickjf"
# Privat registry: angiv -RegistryHost "registry.example.com"

$ErrorActionPreference = "Stop"

function Get-RemoteImageRef {
    param([string]$Tag)
    if ([string]::IsNullOrWhiteSpace($RegistryHost)) {
        return "${Namespace}/${ImageName}:${Tag}"
    }
    return "${RegistryHost}/${Namespace}/${ImageName}:${Tag}"
}

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$LocalTag = "${ImageName}:${Version}"
$RemoteTag = Get-RemoteImageRef -Tag $Version
$RemoteLatest = Get-RemoteImageRef -Tag "latest"

Write-Host ""
if ([string]::IsNullOrWhiteSpace($RegistryHost)) {
    Write-Host "Kør docker login før publish, hvis du ikke allerede er logget ind (Docker Hub)."
} else {
    Write-Host "Kør docker login $RegistryHost før publish, hvis du ikke allerede er logget ind."
}
Write-Host ""

Push-Location $ProjectRoot
try {
    Write-Host "Bygger image: $LocalTag"
    docker build -t $LocalTag .

    Write-Host "Tagger: $RemoteTag"
    docker tag $LocalTag $RemoteTag

    if ($AlsoLatest) {
        Write-Host "Tagger: $RemoteLatest"
        docker tag $LocalTag $RemoteLatest
    }

    Write-Host "Pusher: $RemoteTag"
    docker push $RemoteTag

    if ($AlsoLatest) {
        Write-Host "Pusher: $RemoteLatest"
        docker push $RemoteLatest
    }

    Write-Host ""
    Write-Host "Publish fuldført: $RemoteTag"
    if ($AlsoLatest) {
        Write-Host "Publish fuldført: $RemoteLatest"
    }
}
finally {
    Pop-Location
}
