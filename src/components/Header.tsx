import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="site-header px-4">
      <nav className="page-wrap site-header__nav">
        <h2 className="site-header__brand">
          <Link
            to="/"
            className="site-header__brand-link"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[linear-gradient(90deg,#56c6be,#f4a261)]" />
            Book Nest
          </Link>
        </h2>

        <div className="site-header__links">
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Home
          </Link>
        </div>
      </nav>
    </header>
  )
}
