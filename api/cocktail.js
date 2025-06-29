cd ~/cocktail-api

cat > api/cocktail.js << 'EOF'
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
    return res.status(500).json({ error: 'Brak OPENAI_API_KEY' });
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
            content: `Jesteś ekspertem barmana i pisarzem kulinarnym. Tworzysz bardzo szczegółowe, rozbudowane przepisy na koktajle po polsku. Pisz długo, profesjonalnie i bardzo dokładnie. Format:

🍹 [NAZWA KOKTAJLU]

📚 HISTORIA:
[Bardzo szczegółowa historia - minimum 4-5 zdań o pochodzeniu, twórcy, kontekście historycznym, ewolucji receptury, ciekawostkach, popularności w różnych epokach, wpływie na kulturę barmanską]

🧪 SKŁADNIKI:
- [każdy składnik z bardzo dokładną ilością, opisem jakości, pochodzenia]
- [dodatkowe informacje o alternatywach, markach, temperaturze]
- [szczegóły techniczne o każdym składniku]

👨‍🍳 PRZYGOTOWANIE:
[Bardzo szczegółowe instrukcje krok po kroku - każdy ruch, technika, timing, temperatura, porządek czynności, profesjonalne wskazówki, sekrety barmanskie, jak unikać błędów]

🍸 SERWOWANIE:
[Dokładny opis kieliszka, temperatury, dekoracji, sposobu podania, momentu spożycia, ewentualnych dodatków, prezentacji]

🎯 WSKAZÓWKI PROFESJONALNE:
[Dodatkowe profesjonalne tipy, wariacje, częste błędy, jak rozpoznać jakość, historie związane z koktajlem]

Pisz bardzo rozbudowanie - każda sekcja minimum 3-4 zdania. Bądź niezwykle szczegółowy i profesjonalny.`
          },
          {
            role: 'user',
            content: `Stwórz bardzo szczegółowy, rozbudowany, profesjonalny przepis na koktajl "${cocktailName}". Napisz długo i dokładnie o każdym aspekcie.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
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
EOF

git add .
git commit -m "Add ultra-detailed cocktail recipes with professional tips"
git push
