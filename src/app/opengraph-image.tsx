import { ImageResponse } from 'next/og'

export const alt = 'TicketFlow'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0D0D10',
          position: 'relative',
        }}
      >
        {/* Subtle card boundary outline */}
        <div
          style={{
            position: 'absolute',
            inset: '16px',
            borderRadius: '24px',
            border: '1.5px solid #1F1F24',
          }}
        />

        {/* Center Squircle Icon Badge */}
        <div
          style={{
            width: '110px',
            height: '110px',
            borderRadius: '30px',
            backgroundColor: '#141418',
            border: '2px solid #2B2B32',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '26px',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
            <line x1="13" y1="5" x2="13" y2="7" />
            <line x1="13" y1="11" x2="13" y2="13" />
            <line x1="13" y1="17" x2="13" y2="19" />
          </svg>
        </div>

        {/* Brand Name */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-1.5px',
            marginBottom: '12px',
          }}
        >
          TicketFlow
        </div>

        {/* Natural Tagline without hyphens */}
        <div
          style={{
            fontSize: '24px',
            fontWeight: 400,
            color: '#A1A1AA',
            marginBottom: '38px',
          }}
        >
          Engineering workspace for tasks, daily standups and expenses
        </div>

        {/* Feature Badges */}
        <div
          style={{
            display: 'flex',
            gap: '14px',
          }}
        >
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '12px',
              backgroundColor: '#16161A',
              border: '1.5px solid #27272A',
              color: '#E4E4E7',
              fontSize: '16px',
              fontWeight: 500,
            }}
          >
            Ticket Portal
          </div>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '12px',
              backgroundColor: '#16161A',
              border: '1.5px solid #27272A',
              color: '#E4E4E7',
              fontSize: '16px',
              fontWeight: 500,
            }}
          >
            Activity Heatmap
          </div>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '12px',
              backgroundColor: '#16161A',
              border: '1.5px solid #27272A',
              color: '#E4E4E7',
              fontSize: '16px',
              fontWeight: 500,
            }}
          >
            Expense Tracker
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
