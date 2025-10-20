import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'Canadian Insights',
      nav: {
        dashboard: 'Dashboard',
        transactions: 'Transactions',
        insights: 'Insights',
        settings: 'Settings',
      },
      actions: {
        signIn: 'Sign in',
        signOut: 'Sign out',
        useDemo: 'Explore demo data',
        uploadCsv: 'Upload CSV',
        addTransaction: 'Add transaction',
        applyFilters: 'Apply filters',
        clearFilters: 'Clear',
        giveFeedback: 'Give feedback',
      },
      auth: {
        headline: 'Useful insights in 60 seconds',
        subheadline: 'Upload your statements to see where your money goes and what changed month over month.',
        emailPlaceholder: 'Email address',
        passwordPlaceholder: 'Password (optional)',
        createAccount: 'Create account',
        continueWithEmail: 'Continue with email',
      },
      dashboard: {
        cashflow: 'Cash flow',
        categories: 'Top categories',
        budget: 'Budget strip',
        savings: 'Savings strip',
        monthlyBudget: 'Monthly budget',
        spentThisMonth: 'Spent this month',
        savingsThisMonth: 'Savings this month',
        lastPeriodSavings: 'Last period savings',
        sinceStart: 'Since starting',
      },
      transactions: {
        title: 'Categorize transactions',
        searchPlaceholder: 'Search description or merchant',
        empty: 'Upload a CSV file to populate your transactions.',
      },
      insights: {
        title: 'Insight modules',
        noInsights: 'No insights yet. Upload data to unlock personalised findings.',
      },
      settings: {
        profile: 'Profile',
        accounts: 'Accounts',
        categories: 'Categories',
        feedbackOptions: 'Feedback choices',
        locale: 'Language',
        currency: 'Currency',
        province: 'Province',
        phone: 'Phone',
        save: 'Save changes',
      },
      upload: {
        heading: 'Upload statements',
        subheading: 'We accept CSV exports from your bank or credit card accounts.',
        accountName: 'Account name',
        institution: 'Institution',
        accountType: 'Account type',
        currency: 'Currency',
        file: 'Statement file',
        submit: 'Upload and analyze',
      },
      feedback: {
        prompt: 'Was this helpful?',
      },
    },
  },
  fr: {
    translation: {
      appName: 'Perspectives Canadiennes',
      nav: {
        dashboard: 'Tableau de bord',
        transactions: 'Transactions',
        insights: 'Perspectives',
        settings: 'Paramètres',
      },
      actions: {
        signIn: 'Se connecter',
        signOut: 'Se déconnecter',
        useDemo: 'Explorer la démo',
        uploadCsv: 'Téléverser CSV',
        addTransaction: 'Ajouter une transaction',
        applyFilters: 'Appliquer',
        clearFilters: 'Réinitialiser',
        giveFeedback: 'Donner une rétroaction',
      },
      auth: {
        headline: 'Des perspectives utiles en 60 secondes',
        subheadline: 'Téléversez vos relevés pour comprendre vos dépenses et les changements récents.',
        emailPlaceholder: 'Adresse courriel',
        passwordPlaceholder: 'Mot de passe (optionnel)',
        createAccount: 'Créer un compte',
        continueWithEmail: 'Continuer avec le courriel',
      },
      dashboard: {
        cashflow: 'Flux de trésorerie',
        categories: 'Principales catégories',
        budget: 'Suivi du budget',
        savings: 'Épargne',
        monthlyBudget: 'Budget mensuel',
        spentThisMonth: 'Dépenses ce mois-ci',
        savingsThisMonth: 'Épargne ce mois-ci',
        lastPeriodSavings: 'Épargne période précédente',
        sinceStart: 'Depuis le début',
      },
      transactions: {
        title: 'Catégoriser les transactions',
        searchPlaceholder: 'Rechercher une description ou un marchand',
        empty: 'Téléversez un fichier CSV pour voir vos transactions.',
      },
      insights: {
        title: 'Modules de perspectives',
        noInsights: "Aucune perspective pour l'instant. Téléversez des données pour commencer.",
      },
      settings: {
        profile: 'Profil',
        accounts: 'Comptes',
        categories: 'Catégories',
        feedbackOptions: 'Options de rétroaction',
        locale: 'Langue',
        currency: 'Devise',
        province: 'Province',
        phone: 'Téléphone',
        save: 'Enregistrer',
      },
      upload: {
        heading: 'Téléverser des relevés',
        subheading: 'Nous acceptons les exports CSV de votre banque ou carte de crédit.',
        accountName: 'Nom du compte',
        institution: 'Institution',
        accountType: 'Type de compte',
        currency: 'Devise',
        file: 'Fichier',
        submit: 'Téléverser et analyser',
      },
      feedback: {
        prompt: 'Est-ce utile?',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
