$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content
    
    # Fix explicit types
    $content = $content -replace "scope\?: 'state' \| 'region' \| 'county' \| 'city'", "scope?: 'national' | 'state' | 'region' | 'county' | 'city'"
    $content = $content -replace "currentScope\?: 'state' \| 'region' \| 'county' \| 'city'", "currentScope?: 'national' | 'state' | 'region' | 'county' | 'city'"

    # Fix UI Prompts nextScope logic
    # Find nextScope: 'state' when key is 'state' and make it nextScope: 'national'
    $content = [regex]::Replace($content, "(state:\s*\{\s*nextScope:\s*)'state'(.*?)label:\s*'statewide'", "`$1'national'`$2label: 'nationwide'")

    if ($original -ne $content) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Updated types in $($file.Name)"
    }
}
