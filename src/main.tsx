import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import SiteLayout from './app/site/SiteLayout.tsx'
import { AboutPage, HomePage, NotFoundPage, PackagesPage, PortfolioPage, TermsPage } from './app/site/pages.tsx'
import ProtectedRoute from './app/components/ProtectedRoute.tsx'
import './styles/index.css'

// The dashboard ships in its own chunks — visitors of the public site never download it
const AdminLogin = lazy(() => import('./app/pages/AdminLogin.tsx'))
const AdminLayout = lazy(() => import('./app/pages/admin/AdminLayout.tsx'))

const AdminFallback = () => <div className="min-h-screen bg-[#0a0a0f]" />

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      {/* Public site */}
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin login */}
      <Route
        path="/admin/login"
        element={<Suspense fallback={<AdminFallback />}><AdminLogin /></Suspense>}
      />

      {/* Protected admin area */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <Suspense fallback={<AdminFallback />}>
              <AdminLayout />
            </Suspense>
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
)
