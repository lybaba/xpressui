'use client'


import dynamic from 'next/dynamic'

const App = dynamic(() => import('../Home'), { ssr: false })
 
export function ClientOnly() {
  return <App />
}
