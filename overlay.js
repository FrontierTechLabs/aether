// Overlay function for images
function addWatermarkToImage(imageDataUrl, did, username) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            // Draw image
            ctx.drawImage(img, 0, 0);
            // Draw semi-transparent background for text
            const text = `${username} | ${did.substring(0, 12)}...`;
            const fontSize = Math.max(14, Math.floor(img.width / 40));
            ctx.font = `${fontSize}px Inter, sans-serif`;
            const metrics = ctx.measureText(text);
            const padding = 16;
            const x = img.width - metrics.width - padding * 2;
            const y = img.height - fontSize - padding * 2;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 10;
            ctx.roundRect(x - 10, y - 10, metrics.width + padding * 2, fontSize + padding * 2, 8);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.fillText(text, x, y + fontSize);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.src = imageDataUrl;
    });
}
// Polyfill roundRect if needed
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (r > w/2) r = w/2;
        if (r > h/2) r = h/2;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        return this;
    };
}
