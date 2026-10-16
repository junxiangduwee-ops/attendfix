export const metadata = { title: 'AttendFix — MR DIY', icons: { icon: '/favicon.png' } }
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/css/app.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
