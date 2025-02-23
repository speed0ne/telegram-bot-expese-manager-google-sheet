import { handler } from "./index.js"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const event = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../event.json"), "utf-8"),
)

async function runLocal() {
  try {
    const result = await handler(event)
    console.log("Result:", JSON.stringify(result, null, 2))
  } catch (error) {
    console.error("Error:", error)
  }
}

runLocal()
