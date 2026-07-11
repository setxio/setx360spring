$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content
    
    # 1. Replace scope !== 'state' with scope !== 'national'
    $content = $content -replace "scope !== 'state'", "scope !== 'national'"
    
    # 2. Duplicate scope === 'region' to also handle scope === 'state' where it's a simple one-liner
    $content = [regex]::Replace($content, "else if \(scope === 'region'\) query = query\.eq\((.*?), (.*?)\);", "else if (scope === 'state') query = query.eq(`$1, `$2);`r`n      else if (scope === 'region') query = query.eq(`$1, `$2);")

    # 3. For multi-line region checks, we can duplicate the if block
    $content = [regex]::Replace($content, "\} else if \(scope === 'region'\) \{`r`n(.*?)`r`n\s*\}", "} else if (scope === 'state') {`r`n`$1`r`n        } else if (scope === 'region') {`r`n`$1`r`n        }", [System.Text.RegularExpressions.RegexOptions]::Singleline)

    # 4. Handle useMarketStores and useEvents 
    $content = [regex]::Replace($content, "\} else if \(scope === 'region' && profile\?\.state\) \{`r`n(.*?)`r`n\s*\}", "} else if (scope === 'state' && profile?.state) {`r`n`$1`r`n        } else if (scope === 'region' && profile?.state) {`r`n`$1`r`n        }", [System.Text.RegularExpressions.RegexOptions]::Singleline)

    # 5. Handle ternary operators like `scope !== 'state' ?`
    $content = $content -replace "scope !== 'state' \?", "scope !== 'national' ?"

    if ($original -ne $content) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Updated $($file.Name)"
    }
}
