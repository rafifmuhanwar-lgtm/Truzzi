Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\Adess\.gemini\antigravity-ide\brain\bb170500-1c93-425e-902d-fe1d6fe827d3\.user_uploaded\media_1789571982335.png"
$bmp = New-Object System.Drawing.Bitmap($srcPath)

$minX = $bmp.Width
$minY = $bmp.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        if ($pixel.A -gt 0) {
            if ($x -lt $minX) { $minX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$cropWidth = $maxX - $minX + 1
$cropHeight = $maxY - $minY + 1
$rect = New-Object System.Drawing.Rectangle($minX, $minY, $cropWidth, $cropHeight)
$croppedBmp = $bmp.Clone($rect, $bmp.PixelFormat)

$destPaths = @(
    "e:\The New SentraGo\web\public\favicon.png",
    "e:\The New SentraGo\jastiper\public\favicon.png",
    "e:\The New SentraGo\admin\public\favicon.png",
    "e:\The New SentraGo\landing\public\favicon.png"
)

foreach ($dest in $destPaths) {
    $croppedBmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
}

$bmp.Dispose()
$croppedBmp.Dispose()
Write-Host "Done AutoCrop"
