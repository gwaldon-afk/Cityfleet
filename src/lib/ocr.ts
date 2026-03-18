/**
 * CITY FLEET — OCR (VIN, licence plate, odometer)
 * Uses Tesseract.js in the browser to extract text from photos;
 * then parses VIN (17 chars), odometer (km), or licence plate.
 * Per Technical Architecture: MVP = Tesseract.js for odometer/VIN.
 *
 * Loads Tesseract from CDN at runtime so the app builds without the npm package.
 * Use from client components only.
 */

export type OCRSource = File | string

const TESSERACT_CDN = 'https://unpkg.com/tesseract.js@5/dist/tesseract.min.js'

type TesseractAPI = {
  recognize(
    image: File | string,
    lang: string,
    options?: { logger?: (m: unknown) => void }
  ): Promise<{ data: { text: string } }>
}

/** Load Tesseract from CDN once; reuse for subsequent calls. */
function loadTesseract(): Promise<TesseractAPI> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('OCR is only available in the browser'))
  }
  const w = window as Window & { Tesseract?: TesseractAPI }
  if (w.Tesseract) return Promise.resolve(w.Tesseract)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = TESSERACT_CDN
    script.async = true
    script.onload = () => {
      const T = w.Tesseract
      if (T) resolve(T)
      else reject(new Error('Tesseract failed to load'))
    }
    script.onerror = () => reject(new Error('Failed to load Tesseract from CDN'))
    document.head.appendChild(script)
  })
}

/**
 * Run Tesseract on an image and return raw text.
 * Pass File (from input) or data URL (from canvas/camera).
 */
export async function extractTextFromImage(source: OCRSource): Promise<string> {
  const Tesseract = await loadTesseract()
  const result = await Tesseract.recognize(source, 'eng', {
    logger: () => {},
  })
  return result.data.text
}

/** VIN is 17 characters, alphanumeric (no I, O, Q per standard). */
const VIN_REGEX = /[A-HJ-NPR-Z0-9]{17}/i

/**
 * Parse a 17-character VIN from OCR text.
 * Returns first plausible VIN found, or null.
 */
export function parseVINFromText(ocrText: string): string | null {
  const cleaned = ocrText.replace(/\s/g, '')
  const match = cleaned.match(VIN_REGEX)
  if (match) return match[0].toUpperCase()
  const byWords = ocrText.split(/\s+/).find((w) => w.length === 17 && VIN_REGEX.test(w))
  return byWords ? byWords.toUpperCase() : null
}

/**
 * Capture photo → OCR → parse VIN. Store result in vehicles.vin (and job safety/VIN field if used).
 */
export async function extractVINFromImage(source: OCRSource): Promise<string | null> {
  const text = await extractTextFromImage(source)
  return parseVINFromText(text)
}

/** Odometer: first sequence of 4–7 digits (km reading). */
const ODOMETER_REGEX = /\b(\d{4,7})\b/

export function parseOdometerFromText(ocrText: string): number | null {
  const match = ocrText.match(ODOMETER_REGEX)
  if (!match) return null
  const n = parseInt(match[1], 10)
  return n >= 0 && n <= 9999999 ? n : null
}

/**
 * Capture photo of odometer → OCR → parse km. Store in vehicles.odometer_km or job_odometer_readings.
 */
export async function extractOdometerFromImage(source: OCRSource): Promise<number | null> {
  const text = await extractTextFromImage(source)
  return parseOdometerFromText(text)
}

/** Australian-style plate: letters and numbers, often 6–7 chars. Optional. */
const PLATE_REGEX = /[A-Z0-9]{2,7}/gi

export function parseLicencePlateFromText(ocrText: string): string | null {
  const cleaned = ocrText.replace(/\s/g, '')
  const match = cleaned.match(PLATE_REGEX)
  if (match && match[0]) return match[0].toUpperCase()
  return null
}

export async function extractLicencePlateFromImage(source: OCRSource): Promise<string | null> {
  const text = await extractTextFromImage(source)
  return parseLicencePlateFromText(text)
}
