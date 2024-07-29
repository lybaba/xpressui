import { Metadata } from 'next'
import '../../index.css'
import { ClientOnly } from './client'

export const metadata: Metadata = {
  title: 'Demo',
  description: 'XPressUI, Demo',
}

export function generateStaticParams() {
  return [{ slug: [''] }]
}
 
export default function Page() {
  return <ClientOnly />
}