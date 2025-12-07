$dirs = Get-ChildItem -Path "app\src\main\res" -Directory -Filter "mipmap-*"
foreach ($dir in $dirs) {
    Write-Host "Processing $($dir.Name)"
    $files = Get-ChildItem -Path $dir.FullName -Filter "ic_launcher*.png"
    foreach ($file in $files) {
         $newName = $file.FullName -replace '\.png$', '.jpg'
         if (Test-Path $newName) {
             Remove-Item $newName
         }
         Write-Host "Renaming $($file.Name) to $($file.Name -replace '\.png$', '.jpg')"
         Rename-Item $file.FullName $newName
    }
}
