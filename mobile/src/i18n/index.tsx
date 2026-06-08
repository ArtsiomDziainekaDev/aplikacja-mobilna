import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const languages = ['en', 'pl', 'ru'] as const;
export type Language = (typeof languages)[number];

const STORAGE_KEY = 'app_language';

const translations = {
  en: {
    'common.admin': 'Admin',
    'common.amount': 'Amount',
    'common.cancel': 'Cancel',
    'common.completed': 'Completed',
    'common.date': 'Date',
    'common.email': 'Email address',
    'common.error': 'Error',
    'common.loading': 'Loading...',
    'common.noConnection': 'No connection',
    'common.ok': 'OK',
    'common.order': 'Order',
    'common.orders': 'Orders',
    'common.password': 'Password',
    'common.retry': 'Try Again',
    'common.status': 'Status',
    'common.success': 'Success',
    'common.total': 'Total',
    'common.username': 'Username',

    'errorBoundary.retry': 'Try again',
    'errorBoundary.title': 'Something went wrong',

    'auth.accountCreated': 'Account created. Please log in.',
    'auth.alreadyHaveAccount': 'Already have an account? Sign In',
    'auth.apiAddress': 'API address: {url}',
    'auth.checkConnection': 'Check your internet connection.',
    'auth.createAccount': 'Sign Up',
    'auth.emailAndPasswordRequired': 'Enter email and password',
    'auth.fillAllFields': 'Fill in all fields',
    'auth.goToRegister': "Don't have an account? Sign Up",
    'auth.passwordMin': 'Password (min. 6 characters)',
    'auth.passwordTooShort': 'Password must be at least 6 characters',
    'auth.signIn': 'Sign In',
    'auth.signingIn': 'Signing in...',
    'auth.signingUp': 'Signing up...',

    'crypto.cached': 'Cached data (offline)',
    'crypto.chartsTitle': 'Crypto Charts',
    'crypto.chartsSubtitle': 'Track real-time prices',
    'crypto.count': '{count} coins',
    'crypto.listTitle': 'All Cryptocurrencies',
    'crypto.noChart': 'No chart data',

    'home.addCoin': 'Add Coin',
    'home.calculatorSubtitle': 'Real-time cryptocurrency converter',
    'home.calculatorTitle': 'Crypto Calculator',
    'home.exchangeRate': 'Exchange Rate',
    'home.favoriteCoins': 'Favorite Coins',
    'home.from': 'From',
    'home.invalidAmount': 'Invalid amount',
    'home.invalidAmountMessage': 'Please enter a positive number.',
    'home.invalidConversion': 'Invalid conversion',
    'home.invalidConversionMessage': 'Conversion result is not a valid number.',
    'home.limitReached': 'Limit reached',
    'home.limitReachedMessage': 'Maximum {count} favorite coins allowed.',
    'home.orderFailed': 'Order failed',
    'home.orderPlaced': 'Order placed',
    'home.orderPlacedMessage': 'Created order #{id} for {amount} {currency}.',
    'home.placeOrder': 'Place Order',
    'home.positiveNumber': 'Enter a positive number',
    'home.to': 'To',

    'nav.crypto': 'Crypto',
    'nav.home': 'Home',
    'nav.liveTrading': 'Live Trading',
    'nav.logout': 'Logout',
    'nav.marketStatus': 'Market Status',
    'nav.news': 'News',
    'nav.profile': 'Profile',
    'nav.subtitle': 'Track & Calculate',

    'news.emptySubtitle': 'Pull down to refresh and fetch latest news.',
    'news.emptyTitle': 'No news yet',
    'news.error': 'Failed to load news. Try again.',
    'news.loading': 'Loading news...',
    'news.readMore': 'Read More',
    'news.source': 'Source: {source}',
    'news.sourceFallback': 'News',
    'news.subtitle': 'Stay informed with the latest crypto news',
    'news.title': 'News & Updates',

    'profile.adminPanel': 'Admin Panel',
    'profile.cached': 'Cached data (offline)',
    'profile.completed': 'Completed',
    'profile.guest': 'Guest',
    'profile.holdings': 'Your Holdings',
    'profile.language': 'Language',
    'profile.logout': 'Log Out',
    'profile.noCompletedOrders': 'No completed orders yet',
    'profile.noOrders': 'No orders yet',
    'profile.noRecentActivity': 'No recent activity',
    'profile.notSignedIn': 'Not signed in',
    'profile.orderHistory': 'Order History',
    'profile.placeOrderHint': 'Place an order on the calculator screen to build your portfolio',
    'profile.portfolioOverview': 'Portfolio Overview',
    'profile.recentActivity': 'Recent Activity',
    'profile.subtitle': 'Manage your account and track your trades',
    'profile.title': 'Profile & Orders',
    'profile.totalPortfolio': 'Total Portfolio',
    'profile.verified': 'Verified Account',

    'admin.cancelled': 'Cancelled',
    'admin.empty': 'No orders',
    'admin.errorLoading': 'Failed to load orders',
    'admin.errorTitle': 'Error',
    'admin.orderStatusTitle': 'Order #{id} - change status',
    'admin.pendingConfirmation': 'Pending confirmation',
    'admin.pendingPayment': 'Pending payment',
    'admin.readyForPickup': 'Ready for pickup',
    'admin.statusChangeFailed': 'Could not change status',
    'admin.title': 'Admin panel',
    'admin.updateStatus': 'Change status',
    'admin.user': 'User',
    'admin.currencyAmount': 'Currency / Amount',
    'admin.sum': 'Sum',
    'admin.confirmed': 'Confirmed',
    'admin.inProgress': 'In progress',

    'notFound.button': 'Home',
    'notFound.message': 'This page does not exist.',
    'notFound.title': 'Not found',
  },
  pl: {
    'common.admin': 'Admin',
    'common.amount': 'Ilość',
    'common.cancel': 'Anuluj',
    'common.completed': 'Zakończone',
    'common.date': 'Data',
    'common.email': 'Adres email',
    'common.error': 'Błąd',
    'common.loading': 'Ładowanie...',
    'common.noConnection': 'Brak połączenia',
    'common.ok': 'OK',
    'common.order': 'Zamówienie',
    'common.orders': 'Zamówienia',
    'common.password': 'Hasło',
    'common.retry': 'Spróbuj ponownie',
    'common.status': 'Status',
    'common.success': 'Sukces',
    'common.total': 'Suma',
    'common.username': 'Nazwa użytkownika',

    'errorBoundary.retry': 'Spróbuj ponownie',
    'errorBoundary.title': 'Coś poszło nie tak',

    'auth.accountCreated': 'Konto utworzone. Zaloguj się.',
    'auth.alreadyHaveAccount': 'Masz już konto? Zaloguj się',
    'auth.apiAddress': 'Adres API: {url}',
    'auth.checkConnection': 'Sprawdź połączenie z internetem.',
    'auth.createAccount': 'Zarejestruj się',
    'auth.emailAndPasswordRequired': 'Podaj email i hasło',
    'auth.fillAllFields': 'Wypełnij wszystkie pola',
    'auth.goToRegister': 'Nie masz konta? Zarejestruj się',
    'auth.passwordMin': 'Hasło (min. 6 znaków)',
    'auth.passwordTooShort': 'Hasło musi mieć co najmniej 6 znaków',
    'auth.signIn': 'Zaloguj się',
    'auth.signingIn': 'Logowanie...',
    'auth.signingUp': 'Rejestracja...',

    'crypto.cached': 'Dane z cache (offline)',
    'crypto.chartsTitle': 'Wykresy krypto',
    'crypto.chartsSubtitle': 'Śledź ceny w czasie rzeczywistym',
    'crypto.count': '{count} monet',
    'crypto.listTitle': 'Wszystkie kryptowaluty',
    'crypto.noChart': 'Brak danych wykresu',

    'home.addCoin': 'Dodaj monetę',
    'home.calculatorSubtitle': 'Konwerter kryptowalut w czasie rzeczywistym',
    'home.calculatorTitle': 'Kalkulator krypto',
    'home.exchangeRate': 'Kurs wymiany',
    'home.favoriteCoins': 'Ulubione monety',
    'home.from': 'Z',
    'home.invalidAmount': 'Nieprawidłowa kwota',
    'home.invalidAmountMessage': 'Podaj dodatnią liczbę.',
    'home.invalidConversion': 'Nieprawidłowa konwersja',
    'home.invalidConversionMessage': 'Wynik konwersji nie jest poprawną liczbą.',
    'home.limitReached': 'Osiągnięto limit',
    'home.limitReachedMessage': 'Maksymalnie {count} ulubione monety.',
    'home.orderFailed': 'Zamówienie nieudane',
    'home.orderPlaced': 'Zamówienie złożone',
    'home.orderPlacedMessage': 'Utworzono zamówienie #{id} na {amount} {currency}.',
    'home.placeOrder': 'Złóż zamówienie',
    'home.positiveNumber': 'Podaj dodatnią liczbę',
    'home.to': 'Na',

    'nav.crypto': 'Krypto',
    'nav.home': 'Start',
    'nav.liveTrading': 'Handel aktywny',
    'nav.logout': 'Wyloguj',
    'nav.marketStatus': 'Status rynku',
    'nav.news': 'Wiadomości',
    'nav.profile': 'Profil',
    'nav.subtitle': 'Śledź i obliczaj',

    'news.emptySubtitle': 'Pociągnij w dół, aby odświeżyć wiadomości.',
    'news.emptyTitle': 'Brak wiadomości',
    'news.error': 'Nie udało się załadować wiadomości. Spróbuj ponownie.',
    'news.loading': 'Ładowanie wiadomości...',
    'news.readMore': 'Czytaj więcej',
    'news.source': 'Źródło: {source}',
    'news.sourceFallback': 'Wiadomości',
    'news.subtitle': 'Bądź na bieżąco z najnowszymi wiadomościami krypto',
    'news.title': 'Wiadomości i aktualności',

    'profile.adminPanel': 'Panel administratora',
    'profile.cached': 'Dane z cache (offline)',
    'profile.completed': 'Zakończone',
    'profile.guest': 'Gość',
    'profile.holdings': 'Twoje aktywa',
    'profile.language': 'Język',
    'profile.logout': 'Wyloguj',
    'profile.noCompletedOrders': 'Brak zakończonych zamówień',
    'profile.noOrders': 'Brak zamówień',
    'profile.noRecentActivity': 'Brak ostatniej aktywności',
    'profile.notSignedIn': 'Niezalogowany',
    'profile.orderHistory': 'Historia zamówień',
    'profile.placeOrderHint': 'Złóż zamówienie w kalkulatorze, aby zbudować portfel',
    'profile.portfolioOverview': 'Przegląd portfela',
    'profile.recentActivity': 'Ostatnia aktywność',
    'profile.subtitle': 'Zarządzaj kontem i śledź transakcje',
    'profile.title': 'Profil i zamówienia',
    'profile.totalPortfolio': 'Cały portfel',
    'profile.verified': 'Konto zweryfikowane',

    'admin.cancelled': 'Anulowany',
    'admin.empty': 'Brak zamówień',
    'admin.errorLoading': 'Błąd ładowania zamówień',
    'admin.errorTitle': 'Błąd',
    'admin.orderStatusTitle': 'Zamówienie #{id} - zmiana statusu',
    'admin.pendingConfirmation': 'Oczekuje potwierdzenia',
    'admin.pendingPayment': 'Oczekuje płatności',
    'admin.readyForPickup': 'Gotowy do odbioru',
    'admin.statusChangeFailed': 'Nie udało się zmienić statusu',
    'admin.title': 'Panel administratora',
    'admin.updateStatus': 'Zmień status',
    'admin.user': 'Użytkownik',
    'admin.currencyAmount': 'Waluta / Ilość',
    'admin.sum': 'Suma',
    'admin.confirmed': 'Potwierdzony',
    'admin.inProgress': 'W trakcie',

    'notFound.button': 'Strona główna',
    'notFound.message': 'Ta strona nie istnieje.',
    'notFound.title': 'Nie znaleziono',
  },
  ru: {
    'common.admin': 'Админ',
    'common.amount': 'Количество',
    'common.cancel': 'Отмена',
    'common.completed': 'Завершено',
    'common.date': 'Дата',
    'common.email': 'Email',
    'common.error': 'Ошибка',
    'common.loading': 'Загрузка...',
    'common.noConnection': 'Нет соединения',
    'common.ok': 'OK',
    'common.order': 'Заказ',
    'common.orders': 'Заказы',
    'common.password': 'Пароль',
    'common.retry': 'Попробовать снова',
    'common.status': 'Статус',
    'common.success': 'Успешно',
    'common.total': 'Итого',
    'common.username': 'Имя пользователя',

    'errorBoundary.retry': 'Попробовать снова',
    'errorBoundary.title': 'Что-то пошло не так',

    'auth.accountCreated': 'Аккаунт создан. Войдите в систему.',
    'auth.alreadyHaveAccount': 'Уже есть аккаунт? Войти',
    'auth.apiAddress': 'Адрес API: {url}',
    'auth.checkConnection': 'Проверьте подключение к интернету.',
    'auth.createAccount': 'Регистрация',
    'auth.emailAndPasswordRequired': 'Введите email и пароль',
    'auth.fillAllFields': 'Заполните все поля',
    'auth.goToRegister': 'Нет аккаунта? Зарегистрироваться',
    'auth.passwordMin': 'Пароль (мин. 6 символов)',
    'auth.passwordTooShort': 'Пароль должен быть не короче 6 символов',
    'auth.signIn': 'Войти',
    'auth.signingIn': 'Вход...',
    'auth.signingUp': 'Регистрация...',

    'crypto.cached': 'Данные из кэша (offline)',
    'crypto.chartsTitle': 'Графики криптовалют',
    'crypto.chartsSubtitle': 'Отслеживайте цены в реальном времени',
    'crypto.count': '{count} монет',
    'crypto.listTitle': 'Все криптовалюты',
    'crypto.noChart': 'Нет данных для графика',

    'home.addCoin': 'Добавить монету',
    'home.calculatorSubtitle': 'Конвертер криптовалют в реальном времени',
    'home.calculatorTitle': 'Крипто-калькулятор',
    'home.exchangeRate': 'Курс обмена',
    'home.favoriteCoins': 'Избранные монеты',
    'home.from': 'Из',
    'home.invalidAmount': 'Неверная сумма',
    'home.invalidAmountMessage': 'Введите положительное число.',
    'home.invalidConversion': 'Неверная конвертация',
    'home.invalidConversionMessage': 'Результат конвертации не является числом.',
    'home.limitReached': 'Достигнут лимит',
    'home.limitReachedMessage': 'Можно выбрать максимум {count} избранные монеты.',
    'home.orderFailed': 'Заказ не создан',
    'home.orderPlaced': 'Заказ создан',
    'home.orderPlacedMessage': 'Создан заказ #{id} на {amount} {currency}.',
    'home.placeOrder': 'Создать заказ',
    'home.positiveNumber': 'Введите положительное число',
    'home.to': 'В',

    'nav.crypto': 'Крипта',
    'nav.home': 'Главная',
    'nav.liveTrading': 'Торги активны',
    'nav.logout': 'Выйти',
    'nav.marketStatus': 'Статус рынка',
    'nav.news': 'Новости',
    'nav.profile': 'Профиль',
    'nav.subtitle': 'Отслеживай и считай',

    'news.emptySubtitle': 'Потяните вниз, чтобы обновить новости.',
    'news.emptyTitle': 'Новостей пока нет',
    'news.error': 'Не удалось загрузить новости. Попробуйте снова.',
    'news.loading': 'Загрузка новостей...',
    'news.readMore': 'Читать далее',
    'news.source': 'Источник: {source}',
    'news.sourceFallback': 'Новости',
    'news.subtitle': 'Следите за последними новостями крипторынка',
    'news.title': 'Новости и обновления',

    'profile.adminPanel': 'Панель администратора',
    'profile.cached': 'Данные из кэша (offline)',
    'profile.completed': 'Завершено',
    'profile.guest': 'Гость',
    'profile.holdings': 'Ваши активы',
    'profile.language': 'Язык',
    'profile.logout': 'Выйти',
    'profile.noCompletedOrders': 'Завершённых заказов пока нет',
    'profile.noOrders': 'Заказов пока нет',
    'profile.noRecentActivity': 'Нет недавней активности',
    'profile.notSignedIn': 'Не выполнен вход',
    'profile.orderHistory': 'История заказов',
    'profile.placeOrderHint': 'Создайте заказ на экране калькулятора, чтобы собрать портфель',
    'profile.portfolioOverview': 'Обзор портфеля',
    'profile.recentActivity': 'Недавняя активность',
    'profile.subtitle': 'Управляйте аккаунтом и отслеживайте сделки',
    'profile.title': 'Профиль и заказы',
    'profile.totalPortfolio': 'Весь портфель',
    'profile.verified': 'Подтвержденный аккаунт',

    'admin.cancelled': 'Отменен',
    'admin.empty': 'Заказов нет',
    'admin.errorLoading': 'Ошибка загрузки заказов',
    'admin.errorTitle': 'Ошибка',
    'admin.orderStatusTitle': 'Заказ #{id} - смена статуса',
    'admin.pendingConfirmation': 'Ожидает подтверждения',
    'admin.pendingPayment': 'Ожидает оплаты',
    'admin.readyForPickup': 'Готов к выдаче',
    'admin.statusChangeFailed': 'Не удалось изменить статус',
    'admin.title': 'Панель администратора',
    'admin.updateStatus': 'Изменить статус',
    'admin.user': 'Пользователь',
    'admin.currencyAmount': 'Валюта / Количество',
    'admin.sum': 'Сумма',
    'admin.confirmed': 'Подтвержден',
    'admin.inProgress': 'В процессе',

    'notFound.button': 'На главную',
    'notFound.message': 'Эта страница не существует.',
    'notFound.title': 'Не найдено',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

type TranslationParams = Record<string, string | number>;

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

function isLanguage(value: string): value is Language {
  return (languages as readonly string[]).includes(value);
}

function getDeviceLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2).toLowerCase();
    return isLanguage(locale) ? locale : 'en';
  } catch {
    return 'en';
  }
}

function formatTemplate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

export function I18nProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [language, setLanguageState] = useState<Language>(getDeviceLanguage);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (mounted && stored && isLanguage(stored)) setLanguageState(stored);
      })
      .catch(() => {
        /* Language persistence is best-effort. */
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage: Language): Promise<void> => {
    setLanguageState(nextLanguage);
    await AsyncStorage.setItem(STORAGE_KEY, nextLanguage);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, params) => formatTemplate(translations[language][key] ?? translations.en[key], params),
    }),
    [language, setLanguage]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used within I18nProvider');
  return value;
}
