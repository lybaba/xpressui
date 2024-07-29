'use client'


import dynamic from 'next/dynamic'

const App = dynamic(() => import('./Demo'), { ssr: false })
 
export function ClientOnly() {
  return <App />
}
