import './globals.css'

export const metadata = {
  title: 'AI World Web',
  description: 'Minimal text metaverse player client',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  )
}
