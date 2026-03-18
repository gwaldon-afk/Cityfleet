declare module 'tesseract.js' {
  const recognize: (image: unknown, lang?: string, options?: unknown) => Promise<{ data: { text: string } }>
  export default { recognize }
}
