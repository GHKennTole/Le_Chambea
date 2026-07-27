Add-Type -Assembly System.IO.Compression.FileSystem

$files = Get-ChildItem 'C:\Users\GHKennTole\Desktop\Le_Chambea\Documentcion' -Filter '*.xlsx'
foreach ($f in $files) {
    Write-Output ('Processing: ' + $f.FullName)
    $zip = [System.IO.Compression.ZipFile]::OpenRead($f.FullName)
    
    # List entries
    foreach ($entry in $zip.Entries) {
        Write-Output ('  Entry: ' + $entry.Name)
    }
    
    # Read shared strings (for text values)
    $ssEntry = $zip.GetEntry('xl/sharedStrings.xml')
    if ($ssEntry) {
        $stream = $ssEntry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $ssContent = $reader.ReadToEnd()
        $reader.Close()
        $ssText = [regex]::Replace($ssContent, '<[^>]+>', ' ')
        $ssText = [regex]::Replace($ssText, '\s+', ' ').Trim()
        Write-Output 'Shared Strings:'
        Write-Output $ssText
    }
    
    # Read sheet1
    $sheet1Entry = $zip.GetEntry('xl/worksheets/sheet1.xml')
    if ($sheet1Entry) {
        $stream = $sheet1Entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $shContent = $reader.ReadToEnd()
        $reader.Close()
        $shText = [regex]::Replace($shContent, '<[^>]+>', ' ')
        $shText = [regex]::Replace($shText, '\s+', ' ').Trim()
        Write-Output 'Sheet1 raw:'
        Write-Output $shText.Substring(0, [Math]::Min(5000, $shText.Length))
    }
    
    $zip.Dispose()
}
