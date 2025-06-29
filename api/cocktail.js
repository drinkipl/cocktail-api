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
    return res.status(400).json({ error: 'Parse error' });
  }

  if (!cocktailName) {
    return res.status(400).json({ error: 'Brak nazwy koktajlu' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Brak konfiguracji' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Jesteś ekspertem barmana. Tworzysz szczegółowe przepisy na koktajle po polsku. Format:

🍹 [NAZWA KOKTAJLU]

📚 HISTORIA:
[Szczegółowa historia - pochodzenie, twórca, kontekst historyczny, ciekawostki, ewolucja receptury]

🧪 SKŁADNIKI:
- [składnik 1 z dokładną ilością i opisem]
- [składnik 2 z dokładną ilością i opisem]
- [wszystkie składniki z precyzyjnymi proporcjami]

👨‍🍳 PRZYGOTOWANIE:
[Szczegółowe instrukcje krok po kroku, profesjonalne techniki barmanskie, timing, temperatura]

🍸 SERWOWANIE:
[Dokładny opis kieliszka, temperatury, dekoracji, sposobu podania, prezentacji]

Pisz szczegółowo i profesjonalnie, minimum 4-5 zdań w każdej sekcji.`
          },
          {
            role: 'user',
            content: `Napisz szczegółowy przepis na koktajl "${cocktailName}"`
          }
        ],
        max_tokens: 900,
        temperature: 0.2,
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      return res.status(500).json({ error: 'Błąd OpenAI' });
    }

    const data = await response.json();
    const recipe = data.choices?.[0]?.message?.content;

    if (recipe) {
      return res.status(200).json({
        name: cocktailName,
        content: recipe,
        emoji: '🍸'
      });
    } else {
      return res.status(500).json({ error: 'Brak przepisu' });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Błąd serwera' });
  }
}
