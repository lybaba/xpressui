import '../index.css'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <noscript>You need to enable JavaScript to run this app.</noscript>
                <div id="root" data-post-name="multi-step-form" >
                    {children}
                </div>
            </body>
        </html>
    )
}