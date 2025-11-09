import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-light shadow-sm">
      {/* Top Ad Row */}
      <div className="container-fluid bg-white py-2 border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <Image src="/images/airtel-ad.png" alt="Airtel Ad" width={300} height={80} />
            <Image src="/images/dev-ad.png" alt="Developer Ad" width={300} height={80} />
            <Image src="/images/inoventyk-ad.png" alt="Inoventyk Ad" width={300} height={80} />
          </div>
          <button className="btn btn-light border-0">
            <i className="bi bi-brightness-high-fill fs-5"></i>
          </button>
        </div>
      </div>

      {/* Language Switch */}
      <div className="bg-white border-bottom">
        <div className="container d-flex justify-content-center py-2 gap-4 small fw-semibold">
          <span><Image src="/images/flag-rw.png" alt="RW" width={20} height={15} /> Kinyarwanda</span>
          <span><Image src="/images/flag-uk.png" alt="EN" width={20} height={15} /> English</span>
          <span><Image src="/images/flag-fr.png" alt="FR" width={20} height={15} /> Français</span>
        </div>
      </div>

      {/* Logo + Banner */}
      <div className="container d-flex align-items-center justify-content-between py-3">
        <Link href="/" className="d-flex align-items-center text-decoration-none">
          <Image src="/images/igihe-logo.png" alt="IGIHE Logo" width={200} height={60} />
        </Link>
        <Image
          src="/images/nba-banner.png"
          alt="NBA Ad"
          width={600}
          height={90}
          className="rounded"
        />
      </div>

      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-top border-bottom sticky-top">
        <div className="container">
          <div className="navbar-nav d-flex flex-wrap justify-content-center gap-4 w-100">
            <Link href="/" className="nav-link fw-semibold text-primary active">Home</Link>
            <Link href="/politics" className="nav-link">Politics</Link>
            <Link href="/health" className="nav-link">Health</Link>
            <Link href="/sports" className="nav-link">Sports</Link>
            <Link href="/entertainment" className="nav-link">Entertainment</Link>
            <Link href="/technology" className="nav-link">Technology</Link>
            <Link href="/culture" className="nav-link">Culture</Link>
            <Link href="/economy" className="nav-link">Economy</Link>
            <Link href="/people" className="nav-link">People</Link>
            <Link href="/tourism" className="nav-link">Tourism</Link>
            <Link href="/environment" className="nav-link">Environment</Link>
            <Link href="/religion" className="nav-link">Religion</Link>
            <Link href="/news" className="nav-link">News</Link>
          </div>

          <div className="d-flex align-items-center gap-3 ms-auto">
            <i className="bi bi-search fs-5"></i>
            <i className="bi bi-list fs-4"></i>
          </div>
        </div>
      </nav>
    </header>
  );
}
