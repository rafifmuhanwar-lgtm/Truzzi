/**
 * Watermark utility — menambahkan overlay timestamp + "Truzzi Verified"
 * pada foto sebelum diupload, menggunakan HTML Canvas.
 */

export async function addWatermark(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Watermark settings
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const lines = [
        `📅 ${dateStr}  ⏰ ${timeStr}`,
        '✅ Truzzi Verified',
      ];

      const fontSize = Math.max(14, Math.floor(img.width / 30));
      ctx.font = `bold ${fontSize}px sans-serif`;

      // Semi-transparent background bar at bottom
      const padding = fontSize * 0.6;
      const barHeight = (fontSize + padding) * lines.length + padding;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, img.height - barHeight, img.width, barHeight);

      // Draw text lines
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'top';
      lines.forEach((line, i) => {
        const y = img.height - barHeight + padding + i * (fontSize + padding);
        ctx.fillText(line, padding, y);
      });

      // Convert canvas to File
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Failed to create blob'));
        const watermarkedFile = new File([blob], file.name, { type: 'image/jpeg' });
        resolve(watermarkedFile);
      }, 'image/jpeg', 0.9);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
