import { AxiosError } from 'axios';

export const getErrorMessage = (error: any): string => {
  if (error.response) {
    const { status, data } = error.response;
    
    // Jeśli serwer zwrócił własną wiadomość o błędzie
    if (data?.message) {
      return data.message;
    }
    
    // Стандартные сообщения об ошибках
    switch (status) {
      case 400:
        return 'Nieprawidłowe dane. Sprawdź wprowadzone informacje.';
      case 401:
        return 'Brak autoryzacji. Zaloguj się ponownie.';
      case 403:
        return 'Brak uprawnień do wykonania tej operacji.';
      case 404:
        return 'Zasób nie został znaleziony.';
      case 409:
        return 'Konflikt danych. Zasób już istnieje.';
      case 422:
        return 'Dane nie przeszły walidacji.';
      case 429:
        return 'Zbyt wiele żądań. Spróbuj ponownie później.';
      case 500:
        return 'Błąd serwera. Spróbuj ponownie później.';
      case 502:
        return 'Błąd bramy. Serwer jest niedostępny.';
      case 503:
        return 'Serwis niedostępny. Spróbuj ponownie później.';
      case 504:
        return 'Przekroczono limit czasu żądania.';
      default:
        return `Błąd HTTP ${status}. Spróbuj ponownie później.`;
    }
  }
  
  if (error.request) {
    return 'Brak połączenia z serwerem. Sprawdź połączenie internetowe.';
  }
  
  return error.message || 'Wystąpił nieoczekiwany błąd.';
};

export const handleApiError = (error: any): string => {
  console.error('API Error:', error);
  return getErrorMessage(error);
}; 