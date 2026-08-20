import React from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner({ source }) {
  if (source !== 'demo') return null
  return (
    <div className="offline-banner" role="status">
      <WifiOff size={15} />
      <span>
        Backend at 127.0.0.1:8000 is unreachable — showing demo data for the Dharan network.
      </span>
    </div>
  )
}
