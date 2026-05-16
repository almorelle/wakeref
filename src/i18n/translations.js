export const t = {
  fr: {
    // Nav
    home:    'Accueil',
    figures: 'Figures',
    quiz:    'Quiz',

    // Home
    appSubtitle:   'Référentiel wakeboard & wakeskate',
    searchPlaceholder: 'Rechercher une figure…',
    categories:    'Catégories',
    recentFigures: 'Figures récentes',
    noResults:     (q) => `Aucune figure trouvée pour « ${q} »`,

    // Figures list
    all:     'Tous',
    noFiguresInCat: 'Aucune figure dans cette catégorie.',

    // Figure detail
    back:        'Retour',
    description: 'Description',
    tips:        'Conseils',
    prerequisites: 'Prérequis',
    noPrereqs:   'Aucun prérequis — figure accessible aux débutants',
    videos:      'Vidéos',
    noVideos:    'Aucune vidéo pour cette figure.',
    originalSource: 'Voir la source originale',
    pedagogicNote: 'Utilisé à des fins pédagogiques uniquement.',
    takedownCta:   "Vous êtes l'auteur·ice ? Demander le retrait →",
    notFound:    'Figure introuvable.',

    // Takedown modal
    takedownTitle:   'Demande de retrait',
    takedownInfo:    "Si vous êtes l'auteur·ice de cette vidéo et souhaitez qu'elle soit retirée de WakeRef, remplissez ce formulaire. Nous traiterons votre demande rapidement.",
    takedownName:    'Nom',
    takedownEmail:   'Email',
    takedownMessage: 'Message',
    takedownNamePh:  'Votre nom ou pseudo',
    takedownMsgPh:   'Précisez si nécessaire…',
    takedownSend:    'Envoyer la demande',
    takedownSuccessMsg: 'Votre demande a bien été envoyée. Nous traiterons votre demande dans les plus brefs délais.',
    cancel: 'Annuler',
    close:  'Fermer',

    // Quiz
    quizQuestion:  'Quelle est cette figure ?',
    quizNext:      'Question suivante →',
    quizResult:    'Voir le résultat →',
    quizReplay:    'Rejouer',
    quizCorrect:   (name) => `Bonne réponse ! ${name}`,
    quizWrong:     (name) => `C'était : ${name}`,
    quizScoreMsgs: [
      "Continue à t'entraîner, les figures n'attendent pas ! 🏄",
      'Pas mal, mais le wake a encore des secrets pour toi.',
      'Bon niveau ! Tu commences à reconnaître les moves.',
      'Très bon score ! Tu maîtrises bien les figures.',
      'Parfait ! Tu peux coacher la compétition. 🏆',
    ],

    // Catégories
    catNames: {
      grabs:     'Grabs',
      spins:     'Spins',
      inverts:   'Inverts',
      slides:    'Slides',
      surface:   'Surface',
      wakeskate: 'Wakeskate',
    },

    // Difficulty
    difficulty: 'Difficulté',
    contact: 'Contact',

    // Contact
    contactTitle:     'Contact',
    contactSub:       'Une question, une suggestion, un signalement ? Envoie-moi un message.',
    contactName:      'Nom',
    contactNamePh:    'Ton nom ou pseudo',
    contactEmail:     'Email',
    contactMessage:   'Message',
    contactMessagePh: 'Dis-moi tout…',
    contactSend:      'Envoyer',
    contactSending:   'Envoi en cours…',
    contactSuccess:   'Message envoyé ! Je te répondrai dès que possible.',
    contactError:     'Une erreur est survenue. Réessaie ou contacte-moi directement.',
  },

  en: {
    // Nav
    home:    'Home',
    figures: 'Tricks',
    quiz:    'Quiz',

    // Home
    appSubtitle:       'Wakeboard & wakeskate trick reference',
    searchPlaceholder: 'Search a trick…',
    categories:        'Categories',
    recentFigures:     'Recent tricks',
    noResults:         (q) => `No trick found for "${q}"`,

    // Figures list
    all:     'All',
    noFiguresInCat: 'No tricks in this category.',

    // Figure detail
    back:        'Back',
    description: 'Description',
    tips:        'Tips',
    prerequisites: 'Prerequisites',
    noPrereqs:   'No prerequisites — beginner-friendly trick',
    videos:      'Videos',
    noVideos:    'No video for this trick yet.',
    originalSource: 'View original source',
    pedagogicNote: 'Used for educational purposes only.',
    takedownCta:   'Are you the author? Request removal →',
    notFound:    'Trick not found.',

    // Takedown modal
    takedownTitle:   'Removal request',
    takedownInfo:    "If you are the author of this video and would like it removed from WakeRef, please fill in this form. We'll handle your request promptly.",
    takedownName:    'Name',
    takedownEmail:   'Email',
    takedownMessage: 'Message',
    takedownNamePh:  'Your name or handle',
    takedownMsgPh:   'Additional details if needed…',
    takedownSend:    'Send request',
    takedownSuccessMsg: 'Your request has been submitted. We will process it as soon as possible.',
    cancel: 'Cancel',
    close:  'Close',

    // Quiz
    quizQuestion:  'What trick is this?',
    quizNext:      'Next question →',
    quizResult:    'See result →',
    quizReplay:    'Play again',
    quizCorrect:   (name) => `Correct! ${name}`,
    quizWrong:     (name) => `It was: ${name}`,
    quizScoreMsgs: [
      "Keep practising, the wake doesn't wait! 🏄",
      'Not bad, but the wake still has secrets for you.',
      "Good level! You're starting to recognise the moves.",
      'Great score! You know your tricks well.',
      'Perfect! You could coach the competition. 🏆',
    ],

    // Catégories
    catNames: {
      grabs:     'Grabs',
      spins:     'Spins',
      inverts:   'Inverts',
      slides:    'Slides',
      surface:   'Surface',
      wakeskate: 'Wakeskate',
    },

    // Difficulty
    difficulty: 'Difficulty',
    contact: 'Contact',

    // Contact
    contactTitle:     'Contact',
    contactSub:       'A question, suggestion, or report? Send me a message.',
    contactName:      'Name',
    contactNamePh:    'Your name or handle',
    contactEmail:     'Email',
    contactMessage:   'Message',
    contactMessagePh: 'Tell me everything…',
    contactSend:      'Send',
    contactSending:   'Sending…',
    contactSuccess:   'Message sent! I will get back to you as soon as possible.',
    contactError:     'Something went wrong. Please try again.',
  },
}

