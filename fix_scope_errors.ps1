$files = @(
    "src\components\AutoView.tsx",
    "src\components\EatsView.tsx",
    "src\components\EventsView.tsx",
    "src\components\ProductSearch.tsx",
    "src\components\ServicesView.tsx",
    "src\components\ShortsFeed.tsx",
    "src\components\TrendingView.tsx",
    "src\components\VideosView.tsx",
    "src\components\JobsView.tsx",
    "src\components\HotDealsView.tsx",
    "src\components\HomesView.tsx",
    "src\components\MarketHome.tsx",
    "src\components\DiscoverView.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = [System.IO.File]::ReadAllText($file)
        
        # We target specific known patterns to be safe
        $updated = [regex]::Replace($content, "else if \(scope === 'state'\) query = query\.eq", "else if (scope === 'region') query = query.eq")
        $updated = [regex]::Replace($updated, "\} else if \(scope === 'state' && user\.state\) \{", "} else if (scope === 'region' && user.state) {")
        $updated = [regex]::Replace($updated, "\} else if \(scope === 'state' && user\?\.state\) \{", "} else if (scope === 'region' && user?.state) {")
        
        if ($updated -ne $content) {
            [System.IO.File]::WriteAllText($file, $updated)
            Write-Host "Fixed: $file"
        }
    }
}
