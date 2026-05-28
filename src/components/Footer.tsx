export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer px-4 pb-10 pt-6">
      <div className="page-wrap site-footer__inner">
        <p>&copy; {year} Book Nest</p>
      </div>
    </footer>
  )
}
