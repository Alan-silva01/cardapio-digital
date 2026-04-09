import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  const logoPath = path.join(process.cwd(), 'public/favicon.png');
  const fileBuffer = fs.readFileSync(logoPath);
  const base64 = fileBuffer.toString('base64');
  const src = `data:image/png;base64,${base64}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1c1c1c',
          borderRadius: '8px', 
        }}
      >
        <img src={src} width={20} height={20} alt="Intelflux Logo" />
      </div>
    ),
    { ...size }
  );
}
