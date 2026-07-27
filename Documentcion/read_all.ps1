Add-Type -Assembly System.IO.Compression.FileSystem
$files = Get-ChildItem 'C:\Users\GHKennTole\Desktop\Le_Chambea\Documentcion' -Filter '*.docx'
foreach ($f in $files) {
    Write-Output ('File: ' + $f.FullName)
    $zip = [System.IO.Compression.ZipFile]::OpenRead($f.FullName)
    $entry = $zip.GetEntry('word/document.xml')
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    $reader.Close()
    $zip.Dispose()
    $text = [regex]::Replace($content, '<[^>]+>', ' ')
    $text = [regex]::Replace($text, '\s+', ' ').Trim()
    Write-Output ('LENGTH: ' + $text.Length)
    Write-Output $text
    Write-Output '---END---'
}

# Also read orientaciones
$files2 = Get-ChildItem 'C:\Users\GHKennTole\Desktop\Le_Chambea\Documentcion\orientaciones' -Filter '*.docx'
foreach ($f in $files2) {
    Write-Output ('File: ' + $f.FullName)
    $zip = [System.IO.Compression.ZipFile]::OpenRead($f.FullName)
    $entry = $zip.GetEntry('word/document.xml')
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    $reader.Close()
    $zip.Dispose()
    $text = [regex]::Replace($content, '<[^>]+>', ' ')
    $text = [regex]::Replace($text, '\s+', ' ').Trim()
    Write-Output ('LENGTH: ' + $text.Length)
    Write-Output $text
    Write-Output '---END---'
}
