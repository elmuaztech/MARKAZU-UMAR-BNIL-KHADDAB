Add-Type -Assembly System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("Markazu_Umar_School_Management_System_Project_Brief (3).docx")
$entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlText = $reader.ReadToEnd()
$stream.Close()
$zip.Dispose()

# Save extracted text formatted nicely
$xml = [xml]$xmlText
$nodes = $xml.SelectNodes("//w:p", $mgr)

# Or extract all text elements
$nsManager = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$nsManager.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

$paragraphs = $xml.SelectNodes("//w:p", $nsManager)
foreach ($p in $paragraphs) {
    $pText = ""
    $tNodes = $p.SelectNodes(".//w:t", $nsManager)
    foreach ($t in $tNodes) {
        $pText += $t.InnerText
    }
    if ($pText.Trim().Length -gt 0) {
        Write-Output $pText
    }
}
