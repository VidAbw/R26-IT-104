const http = require('http');

const testCases = [
  { name: "physical abuse", description: "My 10 year old child was hit and beaten by a neighbor causing physical harm.", language: "en" },
  { name: "neglect", description: "A father abandoned his 5 year old child in a house without food or care.", language: "en" },
  { name: "abandonment", description: "A baby was left abandoned at a roadside by unknown parents.", language: "en" },
  { name: "sexual harassment", description: "An adult man made inappropriate sexual comments and touched a 14 year old girl on a bus.", language: "en" },
  { name: "sexual abuse", description: "A child was subjected to severe sexual assault and rape by a relative.", language: "en" },
  { name: "trafficking", description: "A child was forced into slavery and debt bondage at an illegal facility.", language: "en" },
  { name: "kidnapping", description: "A 7 year old child was kidnapped and taken away from her lawful guardian without consent.", language: "en" },
  { name: "online/material abuse", description: "Obscene photos and explicit child abuse material were shared on social media and internet platforms.", language: "en" },
  { name: "Sinhala physical abuse", description: "වයස අවුරුදු 10ක දරුවෙකුට පහර දී ශාරීරික හානි සිදු කර ඇත.", language: "si" },
  { name: "Age under 12 abandonment", description: "A mother abandoned her 4 year old child on the street.", language: "en" },
  { name: "Age 16 cruelty", description: "A 16 year old child was subjected to severe cruelty and beating at home.", language: "en" }
];

async function runTest(tc) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ description: tc.description, language: tc.language });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8000,
      path: '/api/rag/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ tc, response: JSON.parse(body) });
        } catch (e) {
          resolve({ tc, raw: body, error: e.message });
        }
      });
    });
    req.on('error', err => resolve({ tc, error: err.message }));
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log("=== RUNNING FRONTEND-BACKEND INTEGRATION TESTS ===\n");
  for (const tc of testCases) {
    const res = await runTest(tc);
    console.log(`--- TEST: ${tc.name} (${tc.language}) ---`);
    console.log(`Query: ${tc.description}`);
    if (res.error) {
      console.log(`ERROR: ${res.error}`);
    } else {
      console.log(`Detected Language: ${res.response.detected_language}`);
      console.log(`Abuse Category: ${res.response.abuse_category} (EN: ${res.response.abuse_category_en}, SI: ${res.response.abuse_category_si})`);
      console.log(`Primary Laws Count: ${res.response.relevant_laws?.filter(l => l.law_type !== 'supporting').length}`);
      console.log(`Supporting Laws Count: ${res.response.relevant_laws?.filter(l => l.law_type === 'supporting').length}`);
      
      res.response.relevant_laws?.forEach((law, i) => {
        const typeStr = law.law_type || 'primary';
        console.log(`  [Law ${i+1} - ${typeStr}] Section ${law.section} (${law.law_name}): ${law.title}`);
        if (law.related_provisions && law.related_provisions.length > 0) {
          console.log(`    -> Related Provisions (${law.related_provisions.length}):`);
          law.related_provisions.forEach(sub => {
            console.log(`       - Section ${sub.section} (${sub.law_name}): ${sub.title}`);
          });
        }
      });
    }
    console.log("\n");
  }
}

main();
