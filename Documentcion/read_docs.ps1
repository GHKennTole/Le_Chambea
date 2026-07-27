
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

Write-Output "=== PLANTILLA PRINCIPAL ==="
$t1 = Read-Docx "$base\Plantilla Documento Proyecto Graduación.docx"
Write-Output $t1.Substring(0, [Math]::Min(15000, $t1.Length))
Write-Output ("TOTAL PLANTILLA: " + $t1.Length)

Write-Output ""
Write-Output "=== ORIENTACIONES ==="
$t2 = Read-Docx "$base\orientaciones\Orientaciones Documento (1).docx"
Write-Output $t2.Substring(0, [Math]::Min(10000, $t2.Length))
Write-Output ("TOTAL ORIENTACIONES: " + $t2.Length)

Write-Output ""
Write-Output "=== PLANTILLA VACIA ==="
$t3 = Read-Docx "$base\orientaciones\Plantilla Documento.docx"
Write-Output $t3.Substring(0, [Math]::Min(10000, $t3.Length))
Write-Output ("TOTAL PLANTILLA VACIA: " + $t3.Length)
