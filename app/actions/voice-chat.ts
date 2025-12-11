"use server"

export async function sendVoiceMessage(transcript: string) {
  try {
    const response = await fetch("https://dev.noxyai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NOXYAI_API_KEY || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: transcript }],
        model: "supernoxy.v1",
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to get response from AI")
    }

    const data = await response.json()
    return {
      success: true,
      response: data.choices?.[0]?.message?.content || "No response",
    }
  } catch (error) {
    console.error("[v0] Voice chat error:", error)
    return {
      success: false,
      response: "Error connecting to AI",
    }
  }
}
