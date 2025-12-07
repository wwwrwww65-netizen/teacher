Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem -Path "app\src\main\res\mipmap-*" -Filter "ic_launcher*.png"
foreach ($file in $files) {
    Write-Host "Checking $($file.FullName)"
    $bytes = Get-Content $file.FullName -Encoding Byte -TotalCount 4
    if ($bytes[0] -eq 255 -and $bytes[1] -eq 216) {
        Write-Host "Found JPEG disguised as PNG: $file"
        try {
            $img = [System.Drawing.Image]::FromFile($file.FullName)
            $tmpName = $file.FullName + ".tmp"
            $img.Save($tmpName, [System.Drawing.Imaging.ImageFormat]::Png)
            $img.Dispose()
            Remove-Item $file.FullName
            Rename-Item $tmpName $file.Name
            Write-Host "Converted to PNG"
        } catch {
            Write-Error "Failed to convert: $_"
        }
    } else {
        Write-Host "File appears to be valid or not JPEG"
    }
}
