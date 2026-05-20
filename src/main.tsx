import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import App from './app/App.tsx'
import AdminLogin from './app/pages/AdminLogin.tsx'
import AdminLayout from './app/pages/admin/AdminLayout.tsx'
import ProtectedRoute from './app/components/ProtectedRoute.tsx'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      {/* Public site */}
      <Route path="/" element={<App />} />

      {/* Admin login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected admin area */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
)
