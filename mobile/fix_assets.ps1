Add-Type -AssemblyName System.Drawing
$dir = "e:\jjj\mobile\assets"
$files = Get-ChildItem -Path $dir -Filter "*.png"
foreach ($file in $files) {
    Write-Host "Checking $($file.Name)"
    $bytes = Get-Content $file.FullName -Encoding Byte -TotalCount 4
    if ($bytes[0] -eq 255 -and $bytes[1] -eq 216) {
        Write-Host "Found JPEG disguised as PNG: $($file.Name)"
        try {
            $img = [System.Drawing.Image]::FromFile($file.FullName)
            $tmpName = $file.FullName + ".tmp"
            $img.Save($tmpName, [System.Drawing.Imaging.ImageFormat]::Png)
            $img.Dispose()
            Remove-Item $file.FullName
            Rename-Item $tmpName $file.Name
            Write-Host "Converted $($file.Name) to real PNG"
        } catch {
            Write-Error "Failed to convert: $_"
        }
    } else {
        Write-Host "$($file.Name) is valid"
    }
}
