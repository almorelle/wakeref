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
const CompositionSimple = lazy(() => import('./pages/CompositionSimple'))
const France2026 = lazy(() => import('./pages/France2026'))
const JudgeTraining = lazy(() => import('./pages/JudgeTraining'))
// Saisie de run à la voix (outil juge) : route NON listée dans la Navbar,
// chunk isolé → un visiteur lambda ne charge jamais ce code.
const JudgeVoice = lazy(() => import('./pages/JudgeVoice'))

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
const AdminJudgeRuns = lazy(() => import('./pages/admin/AdminJudgeRuns'))
const JudgeRunForm = lazy(() => import('./pages/admin/JudgeRunForm'))
const AdminCompetitions = lazy(() => import('./pages/admin/AdminCompetitions'))
const CompetitionSetup = lazy(() => import('./pages/admin/CompetitionSetup'))
// Consommateur public d'un parcours partagé (hors Navbar, lazy) — comme le labo juge.
const CompetitionView = lazy(() => import('./pages/competition/CompetitionView'))

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
            <Route path="/compo-old" element={<CompositionSimple />} />
            <Route path="/judge" element={<JudgeTraining />} />
            <Route path="/judge/voix" element={<JudgeVoice />} />
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
            <Route path="judge-runs" element={<AdminJudgeRuns />} />
            <Route path="judge-runs/new" element={<JudgeRunForm />} />
            <Route path="judge-runs/:id/edit" element={<JudgeRunForm />} />
            <Route path="competitions" element={<AdminCompetitions />} />
            <Route path="competitions/new" element={<CompetitionSetup />} />
            <Route path="competitions/:id/edit" element={<CompetitionSetup />} />
          </Route>

          {/* Feuille de note (public, hors Navbar) : plein écran, grilles France 2026 */}
          <Route path="/composition-simple" element={<France2026 />} />

          {/* Compétition (public, hors Navbar) : le juge charge un parcours par son code */}
          <Route path="/competition" element={<CompetitionView />} />
          <Route path="/competition/:code" element={<CompetitionView />} />

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
