import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLanguage } from '../contexts/language-context'
import SEO from '../components/SEO'
import styles from './Legal.module.css'

/* Pages légales : mentions légales, conditions d’utilisation, confidentialité.
 *
 * Deux partis pris à connaître avant d’y toucher :
 *
 * 1. ANONYMAT DE L’ÉDITEUR. Le site est publié par une personne physique à
 *    titre non professionnel, régime prévu à l’article 6, III, 2° de la LCEN :
 *    l’éditeur peut alors ne pas publier son nom ni son adresse, à la
 *    CONDITION EXPRESSE d’avoir communiqué son identité à son hébergeur. C’est
 *    le cas dès lors que le compte Vercel est ouvert au vrai nom de l’éditeur.
 *    Si le site devient un jour commercial (publicité, vente, dons réguliers),
 *    ce régime tombe et l’identité complète devient obligatoire.
 *
 * 2. RÉDACTION EN FRANÇAIS UNIQUEMENT. Le site est bilingue, ces pages ne le
 *    sont pas : ce sont des engagements de droit français, dont la traduction
 *    n’aurait aucune valeur propre et se désynchroniserait au premier
 *    ajustement. En anglais, un bandeau signale que la version française fait
 *    foi.
 *
 * ⚠️ Ces textes sont un socle sérieux, pas un avis juridique. Le site republie
 * des vidéos tournées par des tiers : c’est le poste de risque réel, à faire
 * relire par un professionnel si l’audience grandit. */

const MAJ = '1er septembre 2026'

const CONTACT = <Link to="/contact">formulaire de contact</Link>

function Page({ title, path, titleEn, children }) {
  const tr = useT()
  const { lang } = useLanguage()
  return (
    <div className="page-container">
      <article className={styles.page}>
        <SEO titleFr={title} titleEn={titleEn} path={path} />
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.updated}>Dernière mise à jour : {MAJ}</p>
        </header>
        {lang === 'en' && <p className={styles.notice}>{tr.legalFrOnly}</p>}
        {children}
      </article>
    </div>
  )
}

const Sec = ({ t, children }) => (
  <section className={styles.sec}>
    <h2>{t}</h2>
    {children}
  </section>
)

/* ───────────────────────── Mentions légales ───────────────────────── */

export function LegalNotice() {
  const tr = useT()
  return (
    <Page title={tr.footerLegal} titleEn="Legal notice" path="/legal">
      <Sec t="Éditeur du site">
        <p>
          WakeRef est édité à titre personnel par une personne physique, dans un
          cadre strictement non professionnel et sans but lucratif. Le site ne
          vend rien, n’accueille aucune publicité et ne perçoit aucune
          rémunération.
        </p>
        <p>
          Conformément à l’article 6, III, 2° de la loi n° 2004-575 du 21 juin
          2004 pour la confiance dans l’économie numérique, l’éditeur non
          professionnel qui souhaite préserver son anonymat n’est pas tenu de
          publier son identité, dès lors qu’il l’a communiquée à son hébergeur.
          C’est le cas ici : les hébergeurs mentionnés ci-dessous détiennent ces
          informations et sont tenus de les conserver.
        </p>
        <p>
          Toute demande peut être adressée via le {CONTACT}. Un signalement de
          contenu obtient une réponse prioritaire.
        </p>
      </Sec>

      <Sec t="Directeur de la publication">
        <p>
          La direction de la publication est assurée par l’éditeur du site, dans
          les conditions d’anonymat rappelées ci-dessus.
        </p>
      </Sec>

      <Sec t="Hébergement">
        <p>Le site et ses données sont hébergés par deux prestataires distincts.</p>
        <ul className={styles.list}>
          <li>
            <strong>Site et diffusion</strong> — Vercel Inc., 440 N Barranca
            Avenue #4133, Covina, CA 91723, États-Unis —{' '}
            <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a>
          </li>
          <li>
            <strong>Base de données, vidéos et images</strong> — Supabase
            Pte. Ltd., 65 Chulia Street #38-02/03, OCBC Centre, Singapour
            049513 —{' '}
            <a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a>.
            Les données sont stockées dans la région Union européenne.
          </li>
        </ul>
      </Sec>

      <Sec t="Propriété intellectuelle">
        <p>
          Le nom WakeRef, son identité visuelle, ses textes, descriptions et
          conseils, ainsi que le choix et l’organisation de la base de figures,
          sont protégés et demeurent la propriété de l’éditeur. En revanche, le
          vocabulaire des figures appartient au patrimoine commun de la
          discipline et n’est revendiqué par personne.
        </p>
        <p>
          <strong>
            Les vidéos et photographies restent la propriété pleine et entière
            de leurs auteur·ices.
          </strong>{' '}
          Elles sont publiées à des fins pédagogiques et créditées à chaque
          parution. Aucune cession de droits n’est revendiquée sur ces contenus.
        </p>
      </Sec>

      <Sec t="Signalement et retrait d’un contenu">
        <p>
          Toute personne estimant qu’un contenu porte atteinte à ses droits —
          droit d’auteur, droit à l’image, vie privée — peut en demander le
          retrait depuis le bouton prévu sur la fiche de chaque vidéo, ou via le{' '}
          {CONTACT}.
        </p>
        <p>
          Le retrait est effectué dans les meilleurs délais et sans discussion
          préalable : la demande de l’auteur·ice prime, la conversation peut
          venir ensuite si elle a lieu d’être.
        </p>
      </Sec>

      <Sec t="Compléments">
        <p>
          Voir également les <Link to="/terms">conditions d’utilisation</Link> et
          la <Link to="/privacy">politique de confidentialité</Link>.
        </p>
      </Sec>
    </Page>
  )
}

/* ─────────────────── Conditions d’utilisation ─────────────────── */

export function Terms() {
  const tr = useT()
  return (
    <Page title={tr.footerTerms} titleEn="Terms of use" path="/terms">
      <Sec t="1. Objet">
        <p>
          WakeRef est un référentiel gratuit des figures de wakeboard, de
          wakeskate et de wakeboard assis pratiquées au câble. Il propose un
          catalogue de figures, un quiz, un composeur de run et un module
          d’entraînement au jugement. Les présentes conditions régissent son
          utilisation ; naviguer sur le site vaut acceptation.
        </p>
      </Sec>

      <Sec t="2. Accès au service">
        <p>
          L’accès est libre, gratuit et ne nécessite aucune création de compte.
          Le service est fourni en l’état, sans garantie de disponibilité ni
          d’exactitude : l’éditeur peut l’interrompre, le modifier ou en
          supprimer une partie à tout moment, notamment pour maintenance, sans
          préavis ni indemnité.
        </p>
        <p>
          Les contenus sont rédigés avec soin mais peuvent comporter des erreurs
          ou des approximations. Toute correction est bienvenue via le {CONTACT}.
        </p>
      </Sec>

      <Sec t="3. Usage autorisé">
        <p>
          Le site est destiné à un usage personnel et pédagogique. Sont
          notamment interdits l’extraction ou la réutilisation d’une partie
          substantielle de la base de figures au sens de l’article L. 342-1 du
          code de la propriété intellectuelle, la collecte automatisée, et toute
          tentative de perturber le fonctionnement du service.
        </p>
      </Sec>

      <Sec t="4. Contenus soumis par les utilisateur·ices">
        <p>
          Chacun·e peut proposer une vidéo via le formulaire dédié. En la
          soumettant, tu déclares et garanties :
        </p>
        <ul className={styles.list}>
          <li>
            détenir les droits sur la vidéo, ou disposer de l’autorisation
            explicite de son auteur·ice ;
          </li>
          <li>
            avoir recueilli l’accord des personnes identifiables qui y
            apparaissent, au titre du droit à l’image ;
          </li>
          <li>
            lorsqu’une personne mineure y apparaît, disposer de l’accord des
            titulaires de l’autorité parentale — le seul accord de
            l’intéressé·e ne suffit pas ;
          </li>
          <li>
            que le contenu ne porte atteinte à aucun droit de tiers et ne
            contrevient à aucune disposition légale.
          </li>
        </ul>
        <p>
          Tu accordes à WakeRef un droit non exclusif, gratuit et
          <strong> révocable à tout moment</strong> de reproduire et de
          représenter ce contenu sur le site, à des fins pédagogiques et
          accompagné de son crédit, pour la durée de sa publication. Aucune
          exploitation commerciale n’en est faite.
        </p>
        <p>
          L’éditeur n’est tenu à aucune obligation de publication et peut
          refuser, modifier le rattachement ou retirer une soumission sans avoir
          à s’en justifier.
        </p>
      </Sec>

      <Sec t="5. Contenus de tiers et droit de retrait">
        <p>
          Certaines vidéos publiées proviennent de créateur·ices de la
          communauté. Elles sont republiées à des fins pédagogiques, créditées
          nommément et liées à leur source lorsque celle-ci est connue.
        </p>
        <p>
          <strong>Toute personne concernée</strong> — l’auteur·ice de la vidéo
          comme les personnes qui y apparaissent — peut en obtenir le retrait,
          sans avoir à motiver sa demande, depuis la fiche vidéo ou via le{' '}
          {CONTACT}. Le droit à l’image du rider est indépendant du droit
          d’auteur de qui a filmé : chacun s’exerce séparément, à tout moment.
        </p>
      </Sec>

      <Sec t="6. Compositions partagées">
        <p>
          Le composeur de run permet d’enregistrer une composition et de la
          partager par lien, sans compte. Toute personne disposant du lien peut
          la consulter : n’y fais figurer aucune information personnelle ou
          confidentielle. L’éditeur peut supprimer une composition, notamment en
          cas d’usage manifestement abusif.
        </p>
      </Sec>

      <Sec t="7. Sécurité et responsabilité">
        <p>
          <strong>
            Le wakeboard et le wakeskate sont des sports à risque, susceptibles
            d’entraîner des blessures graves.
          </strong>{' '}
          Les descriptions, conseils et niveaux de difficulté publiés ici sont
          purement informatifs : ils ne constituent ni une méthode
          d’apprentissage, ni un encadrement, et ne remplacent en aucun cas
          l’enseignement d’un·e moniteur·ice diplômé·e sur un site exploité.
        </p>
        <p>
          Toute figure est tentée sous ta seule responsabilité, avec les
          protections adaptées et dans le respect du règlement du téléski. La
          responsabilité de l’éditeur ne saurait être engagée à raison d’un
          dommage corporel ou matériel survenu lors de la pratique.
        </p>
      </Sec>

      <Sec t="8. Liens et services tiers">
        <p>
          Le site intègre des lecteurs vidéo tiers (YouTube, Instagram) et
          renvoie vers des profils externes. Ces services relèvent de leurs
          propres conditions et politiques, sur lesquelles l’éditeur n’a aucune
          maîtrise.
        </p>
      </Sec>

      <Sec t="9. Données personnelles">
        <p>
          Le traitement des données est décrit dans la{' '}
          <Link to="/privacy">politique de confidentialité</Link>.
        </p>
      </Sec>

      <Sec t="10. Évolution des conditions">
        <p>
          Les présentes conditions peuvent être modifiées à tout moment. La
          version applicable est celle publiée sur cette page, dont la date de
          mise à jour figure en tête.
        </p>
      </Sec>

      <Sec t="11. Droit applicable">
        <p>
          Les présentes conditions sont soumises au droit français. En cas de
          différend, une solution amiable sera recherchée en priorité via le{' '}
          {CONTACT} avant toute action contentieuse.
        </p>
      </Sec>
    </Page>
  )
}

/* ────────────────── Politique de confidentialité ────────────────── */

export function Privacy() {
  const tr = useT()
  return (
    <Page title={tr.footerPrivacy} titleEn="Privacy policy" path="/privacy">
      <Sec t="En résumé">
        <p>
          WakeRef ne demande aucun compte, ne dépose aucun cookie publicitaire,
          ne pratique aucun profilage et ne cède aucune donnée à des tiers à des
          fins commerciales. Les seules données personnelles traitées sont
          celles que tu écris toi-même dans un formulaire.
        </p>
      </Sec>

      <Sec t="Responsable du traitement">
        <p>
          Le responsable du traitement est l’éditeur du site, joignable via le{' '}
          {CONTACT}, dans les conditions d’anonymat exposées dans les{' '}
          <Link to="/legal">mentions légales</Link>.
        </p>
      </Sec>

      <Sec t="Données collectées">
        <ul className={styles.list}>
          <li>
            <strong>Formulaire de contact</strong> — nom (facultatif), adresse
            e-mail et message. Transmis par courriel à l’éditeur pour traiter la
            demande, puis supprimés une fois l’échange clos. Base légale :
            intérêt légitime à répondre.
          </li>
          <li>
            <strong>Soumission d’une vidéo</strong> — lien source, titre, nom et
            lien de l’auteur·ice, légende. Le nom et le lien sont publiés comme
            crédit si la vidéo est retenue, et conservés tant qu’elle reste en
            ligne. Base légale : intérêt légitime à créditer les auteur·ices.
            Le retrait d’un crédit publié, ou de la vidéo elle-même, peut être
            demandé à tout moment depuis sa fiche — par l’auteur·ice comme par
            les personnes filmées.
          </li>
          <li>
            <strong>Demande de retrait</strong> — nom (facultatif), adresse
            e-mail et message. Conservés le temps de traiter la demande et d’en
            garder la trace. Base légale : intérêt légitime à prouver le
            traitement d’une réclamation.
          </li>
          <li>
            <strong>Mesure d’audience</strong> — Vercel Web Analytics, sans
            cookie ni identifiant persistant. Les statistiques sont agrégées et
            ne permettent pas de te réidentifier.
          </li>
          <li>
            <strong>Compteur de consultations des figures</strong> — seuls
            l’identifiant de la figure, la date du jour et un nombre de vues
            sont enregistrés. Aucune adresse IP, aucun identifiant de visiteur :
            ce compteur ne contient aucune donnée personnelle.
          </li>
        </ul>
      </Sec>

      <Sec t="Stockage local dans ton navigateur">
        <p>
          Le site conserve dans ton navigateur ta langue, ton thème, la
          composition en cours et les réglages du module de jugement. Ces
          informations ne quittent jamais ton appareil et ne servent à aucun
          suivi. N’étant ni des cookies de traçage ni des cookies publicitaires,
          elles ne requièrent pas de bandeau de consentement. Vider les données
          du site dans ton navigateur les efface.
        </p>
      </Sec>

      <Sec t="Destinataires et sous-traitants">
        <ul className={styles.list}>
          <li>
            <strong>Vercel Inc.</strong> (États-Unis) — hébergement du site et
            mesure d’audience.
          </li>
          <li>
            <strong>Supabase Pte. Ltd.</strong> (Singapour) — base de données et
            stockage des vidéos, avec des données hébergées dans l’Union
            européenne.
          </li>
          <li>
            <strong>Resend</strong> (États-Unis) — acheminement des messages du
            formulaire de contact.
          </li>
          <li>
            <strong>YouTube / Google</strong> — uniquement si tu lances la
            lecture d’une vidéo intégrée. Le lecteur est chargé en mode
            <span> </span>« sans cookie », mais la lecture entraîne une
            connexion aux serveurs de Google.
          </li>
        </ul>
      </Sec>

      <Sec t="Transferts hors Union européenne">
        <p>
          Vercel et Resend sont établis aux États-Unis, Supabase à Singapour.
          Ces transferts sont encadrés par les clauses contractuelles types de
          la Commission européenne prévues dans les conditions de chacun de ces
          prestataires.
        </p>
      </Sec>

      <Sec t="Tes droits">
        <p>
          Tu disposes d’un droit d’accès, de rectification, d’effacement,
          d’opposition, de limitation et de portabilité sur tes données. Pour
          l’exercer, écris via le {CONTACT}.
        </p>
        <p>
          Si la réponse ne te satisfait pas, tu peux saisir la Commission
          nationale de l’informatique et des libertés —{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">cnil.fr</a>.
        </p>
      </Sec>

      <Sec t="Sécurité">
        <p>
          Les échanges sont chiffrés en HTTPS et l’accès à l’administration est
          restreint à l’éditeur, protégé par mot de passe. Aucun système n’étant
          infaillible, aucune sécurité absolue ne peut être garantie.
        </p>
      </Sec>

      <Sec t="Modifications">
        <p>
          La présente politique peut évoluer. La version applicable est celle
          publiée sur cette page, dont la date de mise à jour figure en tête.
        </p>
      </Sec>
    </Page>
  )
}
