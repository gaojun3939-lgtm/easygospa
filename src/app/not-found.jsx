// 极少用到：网址没经过语言那一层时（例如奇怪的文件名）找不到。正常的找不到页面在 [locale]/not-found.jsx
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f7f4ee', color: '#171a17', fontFamily: '-apple-system, Helvetica, Arial, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: 13, letterSpacing: '.17em' }}>404</p>
          <h1 style={{ fontWeight: 400, fontSize: 32, margin: '8px 0 24px' }}>This page could not be found.</h1>
          <a href="/" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 999, background: '#64734f', color: '#fff', textDecoration: 'none' }}>Back to home</a>
        </div>
      </body>
    </html>
  );
}
