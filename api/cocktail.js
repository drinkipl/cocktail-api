export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona' });
  }

  let cocktailName;
  try {
    if (typeof req.body === 'string') {
      const parsed = JSON.parse(req.body);
      cocktailName = parsed.cocktailName;
    } else if (req.body && req.body.cocktailName) {
      cocktailName = req.body.cocktailName;
    }
  } catch (error) {
    console.error('Parse error:', error);
    return res.status(400).json({ error: 'Parse error' });
  }

  if (!cocktailName) {
    return res.status(400).json({ 
      error: 'Brak cocktailName',
      body: req.body,
      type: typeof req.body
    });
  }

  // Sprawdź czy klucz OpenAI istnieje
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Brak OPENAI_API_KEY' });
  }

  try {
    console.log(`Generuję przepis przez GPT-4: ${cocktailName}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Jesteś ekspertem barmana i tworzysz profesjonalne przepisy na koktajle. 
            Odpowiadaj ZAWSZE po polsku w następującym formacie:

🍹 [NAZWA KOKTAJLU]

📚 HISTORIA:
[Szczegółowa historia koktajlu - pochodzenie, kto stworzył, kiedy, ciekawostki]

🧪 SKŁADNIKI:
- [składnik 1 z dokładną ilością]
- [składnik 2 z dokładną ilością]
- [wszystkie składniki z precyzyjnymi proporcjami]

👨‍🍳 PRZYGOTOWANIE:
[Szczegółowe instrukcje krok po kroku, techniki barmanskie]

🍸 SERWOWANIE:
[Typ kieliszka, temperatura, dekoracje, sposób podania]

Twórz autentyczne, profesjonalne przepisy z prawdziwymi proporcjami i technikami.`
          },
          {
            role: 'user',
            content: `Stwórz profesjonalny, szczegółowy przepis na koktajl "${cocktailName}"`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, errorText);
      return res.status(500).json({ 
        error: 'Błąd OpenAI API',
        status: response.status
      });
    }

    const data = await response.json();
    const recipe = data.choices?.[0]?.message?.content;

    if (recipe) {
      console.log('Przepis GPT-4 wygenerowany pomyślnie');
      return res.status(200).json({
        name: cocktailName,
        content: recipe,
        emoji: '🍸'
      });
    } else {
      console.error('Brak przepisu w odpowiedzi GPT-4');
      return res.status(500).json({ error: 'Nie udało się wygenerować przepisu' });
    }

  } catch (error) {
    console.error('Błąd GPT-4:', error.message);
    return res.status(500).json({ 
      error: 'Błąd serwera',
      message: error.message 
    });
  }
}
