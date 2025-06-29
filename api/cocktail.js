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

  console.log('=== SIMPLE DEBUG ===');
  console.log('req.body:', req.body);
  console.log('typeof req.body:', typeof req.body);

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

  // Zwróć prosty przepis bez OpenAI
  const simpleRecipe = `🍹 ${cocktailName.toUpperCase()}

📚 HISTORIA:
${cocktailName} to klasyczny koktajl o bogatej tradycji.

🧪 SKŁADNIKI:
- Główny alkohol (50ml)
- Dodatki smakowe
- Lód
- Dekoracje

👨‍🍳 PRZYGOTOWANIE:
Wymieszaj wszystkie składniki z lodem.

🍸 SERWOWANIE:
Podawaj w odpowiednim kieliszku.`;

  return res.status(200).json({
    name: cocktailName,
    content: simpleRecipe,
    emoji: '🍸'
  });
}
