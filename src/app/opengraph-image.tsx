import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Material Solutions NJ - Used Forklifts and Material Handling Equipment';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
          padding: '60px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '8px',
            height: '100%',
            background: 'linear-gradient(180deg, #00d4aa 0%, #00a389 100%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'rgba(0, 212, 170, 0.15)',
              border: '1px solid rgba(0, 212, 170, 0.3)',
              borderRadius: '999px',
              padding: '6px 16px',
              fontSize: '14px',
              color: '#00d4aa',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            New Jersey
          </div>
        </div>

        <div
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.1,
            marginBottom: '20px',
            letterSpacing: '-0.02em',
          }}
        >
          Material
        </div>
        <div
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#00d4aa',
            lineHeight: 1.1,
            marginBottom: '32px',
            letterSpacing: '-0.02em',
          }}
        >
          Solutions NJ
        </div>

        <div
          style={{
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '600px',
            lineHeight: 1.4,
          }}
        >
          Quality used forklifts and material handling equipment with transparent pricing and direct inventory access.
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '80px',
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.4)',
          }}
        >
          materialsolutionsnj.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
