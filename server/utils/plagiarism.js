const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')
const pdfParse = require('pdf-parse')
const mammoth = require('mammoth')
const natural = require('natural')

// Extract text from a file based on extension
const extractText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase()

  try {
    if (ext === '.txt' || ext === '.csv') {
      return fs.readFileSync(filePath, 'utf8')
    }

    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath)
      const data = await pdfParse(buffer)
      return data.text
    }

    if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath })
      return result.value
    }

    if (ext === '.zip' || ext === '.rar') {
      return extractTextFromZip(filePath)
    }

    // For other files return empty
    return ''
  } catch (err) {
    console.error(`Failed to extract text from ${filePath}:`, err.message)
    return ''
  }
}

// Extract text from ZIP without extracting files
const extractTextFromZip = (filePath) => {
  try {
    const zip = new AdmZip(filePath)
    const entries = zip.getEntries()
    let allText = ''

    entries.forEach(entry => {
      if (!entry.isDirectory) {
        const ext = path.extname(entry.entryName).toLowerCase()
        if (['.txt', '.csv', '.js', '.py', '.java', '.cpp', '.c', '.html', '.css'].includes(ext)) {
          try {
            const content = zip.readAsText(entry)
            allText += content + '\n'
          } catch (e) {
            // skip unreadable files
          }
        }
      }
    })

    return allText
  } catch (err) {
    console.error('Failed to read ZIP:', err.message)
    return ''
  }
}

// Clean and normalize text
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim()
}

// Calculate similarity between two texts using TF-IDF and cosine similarity
const calculateSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0

  const norm1 = normalizeText(text1)
  const norm2 = normalizeText(text2)

  if (!norm1 || !norm2) return 0

  // Use n-gram comparison for better accuracy
  const getNgrams = (text, n = 3) => {
    const words = text.split(' ')
    const ngrams = new Set()
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.add(words.slice(i, i + n).join(' '))
    }
    return ngrams
  }

  const ngrams1 = getNgrams(norm1)
  const ngrams2 = getNgrams(norm2)

  if (ngrams1.size === 0 || ngrams2.size === 0) {
    // Fall back to word overlap
    const words1 = new Set(norm1.split(' '))
    const words2 = new Set(norm2.split(' '))
    const intersection = new Set([...words1].filter(w => words2.has(w)))
    const union = new Set([...words1, ...words2])
    return union.size === 0 ? 0 : (intersection.size / union.size) * 100
  }

  // Jaccard similarity on ngrams
  const intersection = new Set([...ngrams1].filter(g => ngrams2.has(g)))
  const union = new Set([...ngrams1, ...ngrams2])

  return (intersection.size / union.size) * 100
}

// Main plag check function
const checkPlagiarism = async (submissions) => {
  if (submissions.length < 2) {
    return { pairs: [], message: 'Need at least 2 submissions to check plagiarism.' }
  }

  // Extract text for all submissions
  const texts = await Promise.all(
    submissions.map(async (s) => ({
      studentName: s.studentName,
      studentEmail: s.studentEmail,
      fileName: s.fileName,
      text: await extractText(s.filePath)
    }))
  )

  const pairs = []

  // Compare all pairs
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const s1 = texts[i]
      const s2 = texts[j]

      let similarity = 0

      if (s1.text && s2.text) {
        similarity = calculateSimilarity(s1.text, s2.text)
      } else if (!s1.text && !s2.text) {
        // Both files couldn't be read, check file name similarity
        similarity = s1.fileName === s2.fileName ? 95 : 0
      }

      const simPercent = Math.round(similarity)
      let level = 'low'
      if (simPercent >= 70) level = 'high'
      else if (simPercent >= 40) level = 'medium'

      pairs.push({
        student1: s1.studentName,
        student2: s2.studentName,
        email1: s1.studentEmail,
        email2: s2.studentEmail,
        similarity: `${simPercent}%`,
        level,
        file1: s1.fileName,
        file2: s2.fileName
      })
    }
  }

  // Sort by similarity descending
  pairs.sort((a, b) => parseInt(b.similarity) - parseInt(a.similarity))

  return { pairs }
}

module.exports = { checkPlagiarism }