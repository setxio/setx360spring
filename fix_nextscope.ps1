$files = @(
    'src\components\EatsView.tsx',
    'src\components\EventsView.tsx',
    'src\components\ServicesView.tsx',
    'src\components\ShortsFeed.tsx',
    'src\components\StoresDirectory.tsx',
    'src\components\VideosView.tsx',
    'src\components\JobsView.tsx',
    'src\components\HomesView.tsx',
    'src\components\AutoView.tsx'
)

foreach ($f in $files) {
    (Get-Content $f) -replace 'nextscope', 'nextScope' | Set-Content $f
    Write-Host "Updated $f"
}
