import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Image metadata
export const alt = 'Alé Pouroullis - Software Engineer & Writer'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// Image generation
export default async function Image() {
  // Load fonts from your assets directory
  let crimsonText: Buffer<ArrayBufferLike> | undefined
  let inter: Buffer<ArrayBufferLike> | undefined

  try {
    crimsonText = await readFile(join(process.cwd(), 'assets/fonts/CrimsonText-Regular.ttf'))
  } catch {
    // Font loading is optional, fallback fonts will be used
  }

  try {
    inter = await readFile(join(process.cwd(), 'assets/fonts/Inter_24pt-SemiBold.ttf'))
  } catch {
    // Font loading is optional, fallback fonts will be used
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#fafafa',
          padding: '80px',
          fontFamily: 'ui-serif, Georgia, serif',
          // Subtle paper texture simulation
          backgroundImage: `
            radial-gradient(circle at 20px 10px, rgba(42, 42, 42, 0.06) 1px, transparent 1px),
            radial-gradient(circle at 70px 50px, rgba(42, 42, 42, 0.08) 0.5px, transparent 0.5px),
            radial-gradient(circle at 120px 30px, rgba(42, 42, 42, 0.04) 0.8px, transparent 0.8px)
          `,
          backgroundSize: '160px 140px, 220px 180px, 130px 150px',
        }}
      >
        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            width: '100%',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {/* Title */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 600,
              color: '#1a1a1a',
              lineHeight: 1.1,
              marginBottom: '32px',
              maxWidth: '900px',
              fontFamily: inter ? 'Inter' : 'ui-sans-serif, system-ui, sans-serif',
            }}
          >
            Alé Pouroullis
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '28px',
              color: '#3a3a3a',
              lineHeight: 1.6,
              marginBottom: '0',
              maxWidth: '800px',
              fontFamily: crimsonText ? 'Crimson Text' : 'ui-serif, Georgia, serif',
            }}
          >
            Software engineer and chronic overthinker living in London
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid #e0e0e0',
            paddingTop: '32px',
          }}
        >
          {/* Site */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '24px',
              color: '#2a2a2a',
              fontWeight: 500,
              fontFamily: inter ? 'Inter' : 'ui-sans-serif, system-ui, sans-serif',
            }}
          >
            alepouroullis.com
          </div>

          {/* Subtle geometric accent */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#3a3a3a',
                borderRadius: '50%',
              }}
            />
            <div
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#6a6a6a',
                borderRadius: '50%',
              }}
            />
            <div
              style={{
                width: '4px',
                height: '4px',
                backgroundColor: '#8a8a8a',
                borderRadius: '50%',
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(crimsonText ? [{
          name: 'Crimson Text',
          data: crimsonText,
          style: 'normal' as const,
          weight: 400 as const,
        }] : []),
        ...(inter ? [{
          name: 'Inter',
          data: inter,
          style: 'normal' as const,
          weight: 600 as const,
        }] : []),
      ],
    }
  )
}