Add-Type -AssemblyName System.Drawing

function Create-SafeIcon {
    param(
        [string]$sourcePath,
        [string]$destPath,
        [int]$canvasSize,
        [float]$scaleFactor = 0.72
    )

    $srcImage = [System.Drawing.Image]::FromFile($sourcePath)
    
    # Target size for the logo inside the canvas
    $targetWidth = [int]($canvasSize * $scaleFactor)
    $targetHeight = [int]($canvasSize * $scaleFactor)
    
    # Calculate centering offsets
    $offsetX = [int](($canvasSize - $targetWidth) / 2)
    $offsetY = [int](($canvasSize - $targetHeight) / 2)

    # Create destination bitmap
    $bitmap = New-Object System.Drawing.Bitmap($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

    # High-quality rendering settings
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Fill canvas with crisp white background
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $graphics.FillRectangle($brush, 0, 0, $canvasSize, $canvasSize)

    # Draw the logo centered inside the safe zone
    $graphics.DrawImage($srcImage, $offsetX, $offsetY, $targetWidth, $targetHeight)

    # Save PNG
    $bitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

    # Cleanup
    $graphics.Dispose()
    $brush.Dispose()
    $bitmap.Dispose()
    $srcImage.Dispose()

    Write-Output "Successfully generated: $destPath ($canvasSize x $canvasSize)"
}

$logoSrc = "c:\MARKAZU UMAR ISLAMIYYAH\public\logo.png"

Create-SafeIcon -sourcePath $logoSrc -destPath "c:\MARKAZU UMAR ISLAMIYYAH\public\icon-512.png" -canvasSize 512 -scaleFactor 0.74
Create-SafeIcon -sourcePath $logoSrc -destPath "c:\MARKAZU UMAR ISLAMIYYAH\public\icon-192.png" -canvasSize 192 -scaleFactor 0.74
Create-SafeIcon -sourcePath $logoSrc -destPath "c:\MARKAZU UMAR ISLAMIYYAH\public\logo-rounded.png" -canvasSize 512 -scaleFactor 0.74
