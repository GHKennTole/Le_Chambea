
# Check for PDF tools
$tools = @('pdftotext', 'pdftk', 'ghostscript', 'gs')
foreach ($tool in $tools) {
    $found = Get-Command $tool -ErrorAction SilentlyContinue
    if ($found) { Write-Output "FOUND: $tool at $($found.Source)" }
    else { Write-Output "NOT FOUND: $tool" }
}

# Check npm packages
$pdfParse = node -e "try{require('pdf-parse');console.log('pdf-parse: available')}catch(e){console.log('pdf-parse: not found')}" 2>&1
Write-Output $pdfParse

# Check if we can use Windows built-in pdf handling
$pdfFile = 'C:\Users\GHKennTole\Desktop\Le_Chambea\Documentcion\CentralCoffee_Proyecto_de_graduacion.pdf'
Write-Output "PDF file size: $((Get-Item $pdfFile).Length) bytes"

# Try reading the raw bytes for any text content  
$bytes = [System.IO.File]::ReadAllBytes($pdfFile)
$text = [System.Text.Encoding]::Latin1.GetString($bytes)
# Find readable text segments (sequences of printable ASCII chars)
$matches = [regex]::Matches($text, '[\x20-\x7E]{8,}')
$readable = ($matches | ForEach-Object { $_.Value }) -join "`n"
Write-Output "Readable text found (first 5000 chars):"
Write-Output $readable.Substring(0, [Math]::Min(5000, $readable.Length))
