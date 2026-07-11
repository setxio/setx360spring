$files = Get-ChildItem -Path "src" -Recurse | Where-Object { $_.Extension -match "\.tsx?$" }

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content
    
    # Fix accidental lowercasing of nextScope
    $content = [regex]::Replace($content, "nextscope", "nextScope")
    $content = [regex]::Replace($content, "currentscope", "currentScope")

    if ($original -ne $content) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Fixed casing in $($file.Name)"
    }
}
