import { google } from "googleapis"
import dotenv from "dotenv"
// import OpenAI from "openai"
import TelegramBot from "node-telegram-bot-api"
import { log } from "console"

dotenv.config()

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN environment variable is not set")
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {})

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// })

// async function processExpenseText(text: string): Promise<string[]> {
// const response = await openai.chat.completions.create({
//   model: "gpt-3.5-turbo",
//   messages: [
//     {
//       role: "system",
//       content:
//         "You are a helper that extracts expense information. Return only a JSON array with [category, amount].",
//     },
//     {
//       role: "user",
//       content: text,
//     },
//   ],
//   temperature: 0,
// })

// try {
//   return JSON.parse(response.choices[0].message.content || "[]")
// } catch (error) {
//   console.error("Error parsing OpenAI response:", error)
//   return []
// }
// }

async function writeToSheet(values: string[]) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    const sheets = google.sheets({ version: "v4", auth })
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID

    // Get the first empty row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A:A", // Adjust 'Sheet1' to your sheet name
    })

    const rows = response.data.values || []
    const nextRow = rows.length + 1

    // Write data to the first empty row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A${nextRow}`, // Adjust 'Sheet1' to your sheet name
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    })

    console.log("Data written successfully")
  } catch (error) {
    console.error("Error:", error)
  }
}
async function gateKeeper(msg: any) {
  const usernameAllowed = process.env.USERNAME_ALLOWED!.split(";")
  if (!usernameAllowed.includes(msg.from.username)) {
    await bot.sendMessage(
      msg.chat.id,
      `Ciao ${msg.from.username}. Non sei autorizzato/a a usarmi.\n Chiedi il permesso a chi di dovere prima di usare un povero bot senza cervello!!!`,
    )
    console.log("Aborting.")
    throw "NOT_AUTHORIZED."
  }
}

async function processAndWriteExpense(msg: any) {
  console.log("Processing expense:", msg)
  await gateKeeper(msg)
  await bot.sendMessage(
    msg.chat.id,
    `Ciao ${msg.from.username}! Stavo dormendo 🥱\n aspetta che capisco che cosa mi hai scritto...`,
  )
  if (typeof msg.text !== "string") {
    await bot.sendMessage(msg.chat.id, "Message text must be a string")
    throw new Error("Message text must be a string")
  }

  // const [category, amount] = await processExpenseText(msg.text)
  const expenseData = getExpenseData(msg.text)
  await writeToSheet(expenseData)
  await bot.sendMessage(
    msg.chat.id,
    `Sto inserendo questo! \n${expenseData.join(" 🧡 ")}`,
  )
  await bot.sendMessage(msg.chat.id, `Vabbe io vado!`)
  await bot.sendMessage(
    msg.chat.id,
    "--> https://docs.google.com/spreadsheets/d/1n9CLvj9PSMnFLWb10_8NnrPNM-qVC30dkLM6C6qLszQ/edit?gid=0#gid=0",
  )
}

export function handler(event: any) {
  console.log("Received event:", JSON.stringify(event, null, 2))
  processAndWriteExpense(JSON.parse(event.body).message).catch((error) => {
    console.error("Error managed:", error)
  })
}

function getExpenseData(text: any): string[] {
  const today = new Date().toLocaleDateString()
  const result = text.split(" ")
  return [today, ...result]
}
