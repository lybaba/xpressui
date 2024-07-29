import { Metadata } from 'next'
import '../index.css'
import { ClientOnly } from './client'

export const metadata: Metadata = {
  title: 'XPressUI App',
  description: 'XPressUI, Form Builder, Post UI Builder',
}

export function generateStaticParams() {
  return [{ slug: [''] }]
}
 
export default function Page() {
  return <ClientOnly />
}