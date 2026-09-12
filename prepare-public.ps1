$ErrorActionPreference = 'Stop'
$destination = Join-Path $PSScriptRoot 'publish'
$archive = Join-Path $PSScriptRoot 'sbbl-jawa-barat-github.zip'
$files = @('index.html', 'style.css', 'app.js', 'clustering.js', 'research-data.js', 'coordinates.js', 'facility-locations.js', 'facility-location-audit.csv', 'LOCATIONS.md', '.nojekyll', 'README.md', 'RESEARCH.md', 'PUBLISH.md', 'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css', 'vendor/leaflet/LICENSE')
# An explicit list keeps browser profiles, logs, and local tools out of the archive.
foreach ($relative in $files) {
    $target = Join-Path $destination $relative
    New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $relative) -Destination $target -Force
}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$stream = [IO.File]::Open($archive, [IO.FileMode]::Create)
$zip = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($relative in $files) {
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $destination $relative), $relative, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally { $zip.Dispose(); $stream.Dispose() }
Write-Host "Paket siap: $archive"
Write-Host 'Ekstrak ZIP, lalu unggah isinya ke repositori GitHub. Ikuti PUBLISH.md.'
