// pages/api/get-cocktail-recipe.js (przykładowa ścieżka dla Next.js API Route)

export default async function handler(req, res) {
  // --- Ustawienia CORS (Cross-Origin Resource Sharing) ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Obsługa preflight request dla CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Upewnij się, że żądanie jest metodą POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj metody POST.' });
  }

  // --- Parsowanie i walidacja danych wejściowych (nazwa koktajlu) ---
  let cocktailName;
  try {
    if (typeof req.body === 'string') {
      const parsed = JSON.parse(req.body);
      cocktailName = parsed.cocktailName;
    } else if (req.body && req.body.cocktailName) {
      cocktailName = req.body.cocktailName;
    }
  } catch (error) {
    console.error('Błąd parsowania JSON:', error);
    return res.status(400).json({ error: 'Błąd parsowania żądania. Upewnij się, że wysyłasz poprawny JSON.' });
  }

  // Walidacja, czy nazwa koktajlu została przekazana
  if (!cocktailName) {
    return res.status(400).json({ error: 'Brak nazwy koktajlu w żądaniu. Podaj "cocktailName".' });
  }

  // --- Sprawdzenie zmiennych środowiskowych ---
  if (!process.env.OPENAI_API_KEY) {
    console.error('Błąd konfiguracji: Brak zmiennej środowiskowej OPENAI_API_KEY.');
    return res.status(500).json({ error: 'Błąd konfiguracji serwera: Brak klucza API OpenAI.' });
  }

  // --- Zapytanie do API OpenAI ---
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        // Zmieniono model na gpt-4o dla większej dokładności
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Jesteś wybitnym ekspertem barmańskim, autorem książek z drinkami i historykiem koktajli. Twoim zadaniem jest dostarczanie **dokładnych, standardowych i sprawdzonych receptur** koktajlowych, wraz z ich historią, precyzyjnymi składnikami, szczegółowym sposobem przygotowania i wskazówkami dotyczącymi serwowania. Zawsze podawaj miary w standardowych jednostkach (np. ml, cl, oz lub sztuki, liście, itp.). Proporcje muszą być zgodne z międzynarodowymi standardami barmańskimi. **Jeśli nie znasz konkretnego, powszechnie uznawanego przepisu na dany koktajl, wskaż to wyraźnie, pisząc: "Przepraszamy, nie posiadamy sprawdzonego przepisu na [NAZWA KOKTAJLU]." zamiast generować losową recepturę.**

Format odpowiedzi:

🍹 [NAZWA KOKTAJLU]

📚 HISTORIA:
[3-4 zwięzłe zdania o pochodzeniu i kluczowych ciekawostkach historycznych, np. rok powstania, twórca, miejsce.]

🧪 SKŁADNIKI:
- [Nazwa składnika 1] - [ilość i jednostka]
- [Nazwa składnika 2] - [ilość i jednostka]
- ...

👨‍🍳 PRZYGOTOWANIE:
[3-4 zwięzłe, ale szczegółowe zdania z instrukcjami krok po kroku. Używaj terminologii barmańskiej (np. wstrząśnij, mieszaj, odcedź, udekoruj).]

🍸 SERWOWANIE:
[2-3 zdania o szkle, dekoracji i temperaturze podania.]

Zwięźle, ale kompletnie. Jeśli przepis jest wariantem, podaj jego podstawową wersję.`
          },
          {
            role: 'user',
            content: `Wygeneruj przepis na "${cocktailName}".`
          }
        ],
        max_tokens: 450, // Maksymalna liczba tokenów w odpowiedzi
        temperature: 0.1, // Niska temperatura dla bardziej deterministycznych i spójnych odpowiedzi
        top_p: 0.8 // Kontrola nad różnorodnością odpowiedzi
      })
    });

    // --- Obsługa odpowiedzi z OpenAI ---
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd z API OpenAI:', errorData);
      return res.status(response.status).json({
        error: `Błąd komunikacji z OpenAI: ${errorData.error?.message || 'Nieznany błąd API OpenAI.'}`
      });
    }

    const data = await response.json();
    const recipe = data.choices?.[0]?.message?.content;

    // Sprawdzenie, czy AI zwróciło przepis, czy informację o jego braku
    if (recipe && !recipe.includes(`Przepraszamy, nie posiadamy sprawdzonego przepisu na ${cocktailName}.`)) {
      return res.status(200).json({
        name: cocktailName,
        content: recipe,
        emoji: '🍸'
      });
    } else {
      // Jeśli AI nie znalazło przepisu lub zwróciło wiadomość o braku
      return res.status(404).json({ error: `Nie znaleziono sprawdzonego przepisu na koktajl "${cocktailName}". Spróbuj innej nazwy.` });
    }
  } catch (error) {
    // Ogólna obsługa błędów serwera (np. problemy z siecią, błędy środowiskowe)
    console.error('Błąd serwera podczas przetwarzania żądania:', error);
    return res.status(500).json({ error: 'Wystąpił nieoczekiwany błąd serwera podczas pobierania przepisu.' });
  }
}
