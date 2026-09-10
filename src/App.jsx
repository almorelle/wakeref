import { lazy, Suspense } from 'react'
import { Routes, Route, Outlet, Navigate, useLocation, useParams } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import { SpeedInsights } from '@vercel/speed-insights/react'

// Seule la home est embarquée dans le chunk initial (premier écran).
// Toutes les autres routes publiques sont chargées à la demande.
const Figures = lazy(() => import('./pages/Figures'))
const FigureDetail = lazy(() => import('./pages/FigureDetail'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))
const SubmitVideo = lazy(() => import('./pages/SubmitVideo'))
const LegalNotice = lazy(() => import('./pages/Legal').then(m => ({ default: m.LegalNotice })))
const Terms = lazy(() => import('./pages/Legal').then(m => ({ default: m.Terms })))
const Privacy = lazy(() => import('./pages/Legal').then(m => ({ default: m.Privacy })))
const Quiz = lazy(() => import('./pages/Quiz'))
const Compo = lazy(() => import('./pages/Compo'))
const CompositionSimple = lazy(() => import('./pages/CompositionSimple'))
const France2026 = lazy(() => import('./pages/France2026'))
const Competitions = lazy(() => import('./pages/Competitions'))
const CompetitionDetail = lazy(() => import('./pages/CompetitionDetail'))
const SubmitCompetition = lazy(() => import('./pages/SubmitCompetition'))
const TourCompetitions = lazy(() => import('./pages/TourCompetitions'))
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
const AdminCompetitionSubmissions = lazy(() => import('./pages/admin/AdminCompetitionSubmissions'))
const CompetitionForm = lazy(() => import('./pages/admin/CompetitionForm'))
const AdminParcours = lazy(() => import('./pages/admin/AdminParcours'))
const ParcoursSetup = lazy(() => import('./pages/admin/ParcoursSetup'))
// Consommateur public d'un parcours partagé (hors Navbar, lazy) — comme le labo juge.
const CompetitionView = lazy(() => import('./pages/competition/CompetitionView'))

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Pages publiques */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/figures" element={<Figures />} />
            <Route path="/figures/:slug" element={<FigureDetail />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/composition" element={<Compo />} />
            <Route path="/composition/:id" element={<Compo />} />
            <Route path="/grille-composition-old" element={<CompositionSimple />} />
            <Route path="/competitions" element={<Competitions />} />
            {/* Avant `/competitions/:idSlug` : sans ça, « proposer » serait lu
                comme un identifiant de compétition. */}
            <Route path="/competitions/proposer" element={<SubmitCompetition />} />
            {/* Deux segments : aucune collision possible avec `:idSlug`, qui
                n'en prend qu'un. Groupée ici pour rester lisible avec les autres. */}
            <Route path="/competitions/circuit/:slug" element={<TourCompetitions />} />
            <Route path="/competitions/:idSlug" element={<CompetitionDetail />} />
            <Route path="/entrainement-juge" element={<JudgeTraining />} />
            <Route path="/entrainement-juge/voix" element={<JudgeVoice />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/submit" element={<SubmitVideo />} />
            <Route path="/legal" element={<LegalNotice />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
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
            <Route path="runs-entrainement-juge" element={<AdminJudgeRuns />} />
            <Route path="runs-entrainement-juge/new" element={<JudgeRunForm />} />
            <Route path="runs-entrainement-juge/:id/edit" element={<JudgeRunForm />} />
            <Route path="parcours" element={<AdminParcours />} />
            <Route path="parcours/new" element={<ParcoursSetup />} />
            <Route path="parcours/:id/edit" element={<ParcoursSetup />} />
            <Route path="competitions" element={<AdminCompetitions />} />
            <Route path="competitions/new" element={<CompetitionForm />} />
            <Route path="competitions/:id/edit" element={<CompetitionForm />} />
            <Route path="competition-submissions" element={<AdminCompetitionSubmissions />} />
          </Route>

          {/* Feuille de note (public, hors Navbar) : plein écran, grilles France 2026 */}
          <Route path="/grille-composition" element={<France2026 />} />

          {/* Juge (public, hors Navbar) : le juge charge un parcours par son code */}
          <Route path="/juge" element={<CompetitionView />} />
          <Route path="/juge/:code" element={<CompetitionView />} />

          {/* Anciens chemins encore en circulation (runs partagés, codes de parcours
              transmis aux juges, pages indexées). L'ensemble des suffixes legacy est
              clos — rien, un id, un code, /voix — donc on les déclare un par un plutôt
              qu'avec un splat : `/compo/a/b/c` reste un 404 à son URL réelle au lieu
              d'être réécrit vers un chemin qui n'a jamais existé. */}
          <Route path="/compo" element={<Navigate to="/composition" replace />} />
          <Route path="/compo/:rest" element={<LegacyRedirect to="/composition" />} />
          <Route path="/judge" element={<Navigate to="/entrainement-juge" replace />} />
          <Route path="/judge/voix" element={<Navigate to="/entrainement-juge/voix" replace />} />
          <Route path="/competition" element={<Navigate to="/juge" replace />} />
          <Route path="/competition/:rest" element={<LegacyRedirect to="/juge" />} />

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
      <Footer />
    </>
  )
}

// Redirige un ancien chemin paramétré vers le nouveau : `/compo/x` → `/composition/x`.
// La cible est reconstruite depuis le param, jamais par substitution sur le pathname —
// React Router matche sans tenir compte de la casse, donc `/Compo/x` doit rediriger
// comme `/compo/x` (un `String.replace` y échouerait et servirait une page blanche).
function LegacyRedirect({ to }) {
  const { rest } = useParams()
  const { search, hash } = useLocation()
  return <Navigate to={`${to}/${rest}${search}${hash}`} replace />
}
