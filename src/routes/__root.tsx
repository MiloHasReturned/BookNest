import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { ReactNode } from 'react'
import { BookNestPerformanceMode } from '#/components/book-nest/BookNestPerformanceMode'
import { BookNestProvider } from '#/components/book-nest/BookNestProvider'
import Footer from '../components/Footer'
import Header from '../components/Header'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Book Nest',
      },
      {
        name: 'description',
        content:
          'Book Nest is a shared reservation and scheduling web app with calendars, invites, notes, and chat.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <main className="booknest-screen">
      <div className="page-wrap booknest-app-shell">
        <section className="book-card">
          <div className="section-stack">
            <h1 className="book-hero-title">Page not found</h1>
            <p className="book-hero-copy">
              That page is no longer part of BookNest.
            </p>
            <Link to="/" className="action-button action-button--primary">
              Back to dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <BookNestProvider>
          <BookNestPerformanceMode />
          <Header />
          {children}
          <Footer />
          {import.meta.env.DEV ? (
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          ) : null}
          <Scripts />
        </BookNestProvider>
      </body>
    </html>
  )
}
