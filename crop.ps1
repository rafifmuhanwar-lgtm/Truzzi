Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\Adess\.gemini\antigravity-ide\brain\bb170500-1c93-425e-902d-fe1d6fe827d3\.user_uploaded\media_1789571982335.png"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap($srcImg)

# Crop the top 65% of the image (which usually contains the logo without the text)
$cropWidth = $bmp.Width
$cropHeight = [math]::Floor($bmp.Height * 0.65)
$rect = New-Object System.Drawing.Rectangle(0, 0, $cropWidth, $cropHeight)
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

$srcImg.Dispose()
$bmp.Dispose()
$croppedBmp.Dispose()
Write-Host "Done .NET Crop"
