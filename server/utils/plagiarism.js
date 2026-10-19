const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')
const pdfParse = require('pdf-parse')
const mammoth = require('mammoth')
const crypto = require('crypto')

//TEXT EXTRACTION 

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
    if (ext === '.zip') {
      return extractFromZip(filePath, 'text')
    }
    return ''
  } catch (err) {
    console.error(`Text extraction failed for ${filePath}:`, err.message)
    return ''
  }
}

// IMAGE EXTRACTION 

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']

const extractImages = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  const images = []

  try {
    if (IMAGE_EXTS.includes(ext)) {
      const buffer = fs.readFileSync(filePath)
      images.push({
        name: path.basename(filePath),
        hash: hashImage(buffer),
        size: buffer.length
      })
    }

    if (ext === '.zip') {
      const zipImages = extractFromZip(filePath, 'images')
      images.push(...zipImages)
    }

    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath)
      const data = await pdfParse(buffer)

      images.push({
        name: 'pdf_structure',
        hash: crypto.createHash('md5')
          .update(`${data.numpages}_${buffer.length}`)
          .digest('hex'),
        size: buffer.length
      })
    }
  } catch (err) {
    console.error(`Image extraction failed for ${filePath}:`, err.message)
  }

  return images
}

// Hash image content for comparison
const hashImage = (buffer) => {
  return crypto.createHash('md5').update(buffer).digest('hex')
}

// Perceptual hash for similar image detection
const perceptualHash = (buffer) => {
  const size = buffer.length
  const chunk = Math.floor(size / 64)
  let hash = ''
  let avg = 0
  const values = []

  if (chunk === 0) return ''

  for (let i = 0; i < 64; i++) {
    const start = i * chunk
    let sum = 0

    for (let j = start; j < start + chunk && j < size; j++) {
      sum += buffer[j]
    }

    const val = sum / chunk
    values.push(val)
    avg += val
  }

  avg /= 64

  for (const v of values) {
    hash += v >= avg ? '1' : '0'
  }

  return hash
}

// Hamming distance between two hashes
const hammingDistance = (hash1, hash2) => {
  if (hash1.length !== hash2.length) return hash1.length

  let dist = 0

  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++
  }

  return dist
}

// Extract from ZIP file
const extractFromZip = (filePath, mode) => {
  try {
    const zip = new AdmZip(filePath)
    const entries = zip.getEntries()

    const TEXT_EXTS = [
      '.txt', '.csv', '.js', '.py', '.java', '.cpp',
      '.c', '.html', '.css', '.ts', '.jsx', '.php', '.rb'
    ]

    let allText = ''
    const images = []

    entries.forEach(entry => {
      if (entry.isDirectory) return

      const ext = path.extname(entry.entryName).toLowerCase()

      if (mode === 'text' && TEXT_EXTS.includes(ext)) {
        try {
          allText += zip.readAsText(entry) + '\n'
        } catch (e) {}
      }

      if (mode === 'images' && IMAGE_EXTS.includes(ext)) {
        try {
          const buffer = zip.readFile(entry)

          if (buffer) {
            images.push({
              name: entry.entryName,
              hash: hashImage(buffer),
              phash: perceptualHash(buffer),
              size: buffer.length
            })
          }
        } catch (e) {}
      }
    })

    return mode === 'text' ? allText : images
  } catch (err) {
    console.error('ZIP extraction failed:', err.message)
    return mode === 'text' ? '' : []
  }
}

// TEXT NORMALIZATION 

const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/#.*$/gm, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim()
}

// SIMILARITY ALGORITHMS 

// 1. Rolling hash for fast substring matching
const rollingHash = (text, windowSize = 50) => {
  const hashes = new Set()
  const words = text.split(' ')

  for (let i = 0; i <= words.length - windowSize; i++) {
    const window = words.slice(i, i + windowSize).join(' ')
    const hash = crypto.createHash('md5').update(window).digest('hex')
    hashes.add(hash)
  }

  return hashes
}

// 2. N-gram similarity with configurable n
const ngramSimilarity = (text1, text2, n = 3) => {
  const getNgrams = (text) => {
    const words = text.split(' ')
    const ngrams = new Set()

    for (let i = 0; i <= words.length - n; i++) {
      ngrams.add(words.slice(i, i + n).join(' '))
    }

    return ngrams
  }

  const ng1 = getNgrams(text1)
  const ng2 = getNgrams(text2)

  if (ng1.size === 0 || ng2.size === 0) return 0

  const intersection = new Set([...ng1].filter(g => ng2.has(g)))
  const union = new Set([...ng1, ...ng2])

  return (intersection.size / union.size) * 100
}

// 3. Cosine similarity for comparing text
const cosineSimilarity = (text1, text2) => {
  const words1 = text1.split(' ')
  const words2 = text2.split(' ')

  const freq1 = {}
  const freq2 = {}

  for (const word of words1) {
    if (word) freq1[word] = (freq1[word] || 0) + 1
  }

  for (const word of words2) {
    if (word) freq2[word] = (freq2[word] || 0) + 1
  }

  const allWords = new Set([
    ...Object.keys(freq1),
    ...Object.keys(freq2)
  ])

  let dotProduct = 0
  let magnitude1 = 0
  let magnitude2 = 0

  for (const word of allWords) {
    const count1 = freq1[word] || 0
    const count2 = freq2[word] || 0

    dotProduct += count1 * count2
    magnitude1 += count1 * count1
    magnitude2 += count2 * count2
  }

  if (magnitude1 === 0 || magnitude2 === 0) return 0

  return (
    dotProduct /
    (Math.sqrt(magnitude1) * Math.sqrt(magnitude2))
  ) * 100
}

// 4. Longest Common Subsequence ratio
const lcsRatio = (text1, text2) => {
  const words1 = text1.split(' ').slice(0, 200)
  const words2 = text2.split(' ').slice(0, 200)

  const m = words1.length
  const n = words2.length

  let prev = new Array(n + 1).fill(0)
  let curr = new Array(n + 1).fill(0)

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (words1[i - 1] === words2[j - 1]) {
        curr[j] = prev[j - 1] + 1
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1])
      }
    }

    ;[prev, curr] = [curr, prev]
    curr.fill(0)
  }

  const lcs = prev[n]

  return m + n === 0 ? 0 : (2 * lcs / (m + n)) * 100
}

// 5. Combined text similarity score
const calculateTextSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0

  const norm1 = normalizeText(text1)
  const norm2 = normalizeText(text2)

  if (!norm1 || !norm2) return 0

  if (norm1.length < 50 || norm2.length < 50) {
    const w1 = new Set(norm1.split(' '))
    const w2 = new Set(norm2.split(' '))

    const inter = new Set([...w1].filter(w => w2.has(w)))
    const union = new Set([...w1, ...w2])

    return union.size === 0
      ? 0
      : (inter.size / union.size) * 100
  }

  // Weighted combination of algorithms
  const s1 = ngramSimilarity(norm1, norm2, 3)
  const s2 = ngramSimilarity(norm1, norm2, 5)
  const s3 = cosineSimilarity(norm1, norm2)
  const s4 = lcsRatio(norm1, norm2)

  // Cosine similarity replaces block similarity
  return (s1 * 0.2) + (s2 * 0.2) + (s3 * 0.4) + (s4 * 0.2)
}

// IMAGE SIMILARITY 

const calculateImageSimilarity = (images1, images2) => {
  if (images1.length === 0 || images2.length === 0) return 0

  let totalScore = 0
  let comparisons = 0

  for (const img1 of images1) {
    for (const img2 of images2) {
      // Exact match
      if (img1.hash === img2.hash) {
        totalScore += 100
        comparisons++
        continue
      }

      // Perceptual hash comparison
      if (
        img1.phash &&
        img2.phash &&
        img1.phash.length === img2.phash.length
      ) {
        const dist = hammingDistance(img1.phash, img2.phash)
        const maxDist = img1.phash.length
        const similarity = ((maxDist - dist) / maxDist) * 100

        if (similarity > 60) {
          totalScore += similarity
          comparisons++
        }
      }

      // Size similarity as fallback
      if (img1.size && img2.size) {
        const sizeDiff = Math.abs(img1.size - img2.size)
        const avgSize = (img1.size + img2.size) / 2
        const sizeSim = Math.max(0, (1 - sizeDiff / avgSize) * 100)

        if (sizeSim > 90) {
          totalScore += sizeSim * 0.3
          comparisons++
        }
      }
    }
  }

  return comparisons === 0 ? 0 : totalScore / comparisons
}

//  PLAGIARISM CHECK 

const checkPlagiarism = async (submissions) => {
  if (submissions.length < 2) {
    return {
      pairs: [],
      message: 'Need at least 2 submissions to check plagiarism.'
    }
  }

  console.log(`Checking plagiarism for ${submissions.length} submissions...`)

  // Extract text and images for all submissions in parallel
  const analyzed = await Promise.all(
    submissions.map(async (s) => {
      const [text, images] = await Promise.all([
        extractText(s.filePath),
        extractImages(s.filePath)
      ])

      return {
        studentName: s.studentName,
        studentEmail: s.studentEmail,
        fileName: s.fileName,
        text,
        images
      }
    })
  )

  const pairs = []

  // Compare all pairs
  for (let i = 0; i < analyzed.length; i++) {
    for (let j = i + 1; j < analyzed.length; j++) {
      const s1 = analyzed[i]
      const s2 = analyzed[j]

      const textSim = calculateTextSimilarity(s1.text, s2.text)
      const imageSim = calculateImageSimilarity(s1.images, s2.images)

      const hasText = s1.text.length > 50 && s2.text.length > 50
      const hasImages = s1.images.length > 0 && s2.images.length > 0

      let finalScore = 0

      if (hasText && hasImages) {
        finalScore = (textSim * 0.7) + (imageSim * 0.3)
      } else if (hasText) {
        finalScore = textSim
      } else if (hasImages) {
        finalScore = imageSim
      } else {
        finalScore = s1.fileName === s2.fileName ? 90 : 0
      }

      const simPercent = Math.min(100, Math.round(finalScore))

      let level = 'low'

      if (simPercent >= 70) level = 'high'
      else if (simPercent >= 40) level = 'medium'

      const details = []

      if (hasText) details.push(`Text: ${Math.round(textSim)}%`)
      if (hasImages) details.push(`Images: ${Math.round(imageSim)}%`)

      pairs.push({
        student1: s1.studentName,
        student2: s2.studentName,
        email1: s1.studentEmail,
        email2: s2.studentEmail,
        similarity: `${simPercent}%`,
        textSimilarity: hasText ? `${Math.round(textSim)}%` : 'N/A',
        imageSimilarity: hasImages ? `${Math.round(imageSim)}%` : 'N/A',
        level,
        file1: s1.fileName,
        file2: s2.fileName,
        details: details.join(' | ')
      })
    }
  }

  // Sort by similarity descending
  pairs.sort(
    (a, b) => parseInt(b.similarity) - parseInt(a.similarity)
  )

  const highCount = pairs.filter(p => p.level === 'high').length
  const medCount = pairs.filter(p => p.level === 'medium').length

  return {
    pairs,
    summary: {
      total: pairs.length,
      high: highCount,
      medium: medCount,
      low: pairs.length - highCount - medCount
    }
  }
}

module.exports = { checkPlagiarism }