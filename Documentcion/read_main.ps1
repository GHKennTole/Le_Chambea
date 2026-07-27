
Add-Type -Assembly System.IO.Compression.FileSystem

function Read-Docx {
    param([string]$FilePath)
    $zip = [System.IO.Compression.ZipFile]::OpenRead($FilePath)
    $entry = $zip.GetEntry('word/document.xml')
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    $reader.Close()
    $zip.Dispose()
    $text = [regex]::Replace($content, '<[^>]+>', ' ')
    $text = [regex]::Replace($text, '\s+', ' ').Trim()
    return $text
}

$base = 'C:\Users\GHKennTole\Desktop\Le_Chambea\Documentcion'

Write-Output "=== PLANTILLA PRINCIPAL (COMPLETA) ==="
$t1 = Read-Docx "$base\Plantilla Documento Proyecto Graduación.docx"
Write-Output $t1
Write-Output ""
Write-Output ("=== TOTAL PLANTILLA PRINCIPAL: " + $t1.Length + " chars ===")
