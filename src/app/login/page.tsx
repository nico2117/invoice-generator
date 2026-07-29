export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const hasError = params.error === 'wrong'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ width: 320 }}>
        <h1 style={{ textAlign: 'center' }}>Rechnungs-Generator</h1>
        {hasError && (
          <p style={{ color: 'red', textAlign: 'center' }}>Falsches Passwort</p>
        )}
        <form action="/api/auth/login" method="POST">
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              required
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: 10 }}>
            Anmelden
          </button>
        </form>
      </div>
    </div>
  )
}
