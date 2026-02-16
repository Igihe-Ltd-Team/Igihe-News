export default function NotFound() {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Uh-oh!</h3>
      <p style={styles.text}>It could be you, or it could be us, but there's no page here.</p>
      <a href="/" 
      className="px-8 py-2"
                  style={{
                    color: "#1176BB",
                  }}>
        Go back home
      </a>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: '36px',
    margin: 0,
  },
  text: {
    fontSize: '20px',
    marginBottom: '20px',
  },
  link: {
    color: 'blue',
    textDecoration: 'underline',
  },
}