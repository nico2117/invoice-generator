export default function Home() {
  return (
    <main>
      <h1>Rechnungs-Generator</h1>
      <form action="/api/auth/logout" method="POST">
        <button type="submit">Abmelden</button>
      </form>
    </main>
  )
}
