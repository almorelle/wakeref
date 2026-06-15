import { lazy, Suspense } from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import { SpeedInsights } from '@vercel/speed-insights/react'

// Seule la home est embarquée dans le chunk initial (premier écran).
// Toutes les autres routes publiques sont chargées à la demande.
const Figures = lazy(() => import('./pages/Figures'))
const FigureDetail = lazy(() => import('./pages/FigureDetail'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))
const SubmitVideo = lazy(() => import('./pages/SubmitVideo'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Compo = lazy(() => import('./pages/Compo'))

// Admin : jamais embarqué dans le bundle public
const Login = lazy(() => import('./pages/admin/Login'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminFigures = lazy(() => import('./pages/admin/AdminFigures'))
const FigureForm = lazy(() => import('./pages/admin/FigureForm'))
const AdminVideos = lazy(() => import('./pages/admin/AdminVideos'))
const AdminTakedowns = lazy(() => import('./pages/admin/AdminTakedowns'))
const AdminNoVideos = lazy(() => import('./pages/admin/AdminNoVideos'))
const AdminSubmissions = lazy(() => import('./pages/admin/AdminSubmissions'))
const AdminCompositions = lazy(() => import('./pages/admin/AdminCompositions'))

export default function App() {
  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Pages publiques */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/figures" element={<Figures />} />
            <Route path="/figures/:slug" element={<FigureDetail />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/compo" element={<Compo />} />
            <Route path="/compo/:id" element={<Compo />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/submit" element={<SubmitVideo />} />
          </Route>

          {/* Admin */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="figures" element={<AdminFigures />} />
            <Route path="figures/new" element={<FigureForm />} />
            <Route path="figures/:id/edit" element={<FigureForm />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="takedowns" element={<AdminTakedowns />} />
            <Route path="no-videos" element={<AdminNoVideos />} />
            <Route path="submissions" element={<AdminSubmissions />} />
            <Route path="compositions" element={<AdminCompositions />} />
          </Route>
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Suspense>
      <SpeedInsights />
    </>
  )
}

// Fallback affiché pendant le chargement d'un chunk de route
function RouteFallback() {
  return <div style={{ minHeight: '60vh' }} aria-busy="true" />
}

// Layout public : Navbar + contenu
function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}
