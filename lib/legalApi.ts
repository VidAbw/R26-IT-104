export async function queryLegalRAG(payload: {
  description: string
  language: string
}) {
  console.log("Sending payload:", payload)

  const response = await fetch("http://127.0.0.1:8000/api/rag/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  console.log("Response status:", response.status)

  if (!response.ok) {
    const text = await response.text()
    console.log("Response text:", text)
    throw new Error(text || "Failed to fetch legal guidance")
  }

  return await response.json()
}
