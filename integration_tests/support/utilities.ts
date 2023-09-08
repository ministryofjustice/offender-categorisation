export const cleanString = (rawText): string => rawText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

export default {
  cleanString,
}
