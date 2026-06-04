import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Figures from './pages/Figures'
import FigureDetail from './pages/FigureDetail'
import Quiz from './pages/Quiz'
import Contact from './pages/Contact'
import Compo from './pages/Compo'
import NotFound from './pages/NotFound'
import Login from './pages/admin/Login'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminFigures from './pages/admin/AdminFigures'
import FigureForm from './pages/admin/FigureForm'
import AdminVideos from './pages/admin/AdminVideos'
import AdminTakedowns from './pages/admin/AdminTakedowns'
import AdminNoVideos from './pages/admin/AdminNoVideos'
import AdminSubmissions from './pages/admin/AdminSubmissions'
import AdminCompositions from './pages/admin/AdminCompositions'
import SubmitVideo from './pages/SubmitVideo'
import { SpeedInsights } from '@vercel/speed-insights/react'

export default function App() {
  return (
    <>
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
      <SpeedInsights />
    </>
  )
}

// Layout public : Navbar + contenu
import { Outlet } from 'react-router-dom'
function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}
