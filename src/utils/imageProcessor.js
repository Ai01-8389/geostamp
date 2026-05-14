import ExifReader from 'exifreader'
import JSZip from 'jszip'

export async function extractExifData(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const tags = ExifReader.load(arrayBuffer)
    
    const result = {
      hasExif: false,
      gps: null,
      location: null,
      placeName: null,
      timestamp: null,
    }
    
    if (tags.gps) {
      result.hasExif = true
      
      if (tags.gps.Latitude && tags.gps.Longitude) {
        result.gps = {
          lat: tags.gps.Latitude,
          lng: tags.gps.Longitude
        }
        result.location = `${result.gps.lat.toFixed(6)}, ${result.gps.lng.toFixed(6)}`
      }
    }
    
    if (tags.DateTimeOriginal) {
      result.hasExif = true
      result.timestamp = tags.DateTimeOriginal.description
    } else if (tags.DateTime) {
      result.hasExif = true
      result.timestamp = tags.DateTime.description
    }
    
    return result
  } catch (error) {
    console.warn('EXIF extraction failed:', error)
    return { hasExif: false, gps: null, location: null, placeName: null, timestamp: null }
  }
}

export async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'GeoStamp/1.0.0 (https://geostamp.app)'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed')
    }
    
    const data = await response.json()
    
    if (data.display_name) {
      const parts = data.display_name.split(', ')
      if (parts.length >= 3) {
        return parts.slice(0, 3).join(', ')
      }
      return data.display_name
    }
    
    return null
  } catch (error) {
    console.warn('Reverse geocoding failed:', error)
    return null
  }
}

export function getSerialForDate() {
  const today = new Date()
  const dateKey = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const stored = localStorage.getItem(`serial_${dateKey}`)
  const serial = stored ? parseInt(stored, 10) + 1 : 1
  localStorage.setItem(`serial_${dateKey}`, serial.toString())
  return serial
}

export function getTimestampPrefix() {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
}

export async function processImage(file, exifData, serialNumber) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      
      const barHeight = Math.max(40, Math.floor(img.height * 0.05))
      const padding = Math.max(10, Math.floor(img.width * 0.01))
      const fontSize = Math.max(12, Math.floor(barHeight * 0.4))
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.beginPath()
      ctx.roundRect(0, img.height - barHeight, img.width, barHeight, [12, 0, 0, 0])
      ctx.fill()
      
      ctx.fillStyle = '#ffffff'
      ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`
      ctx.textBaseline = 'middle'
      
      const parts = []
      if (exifData.placeName) {
        parts.push(exifData.placeName)
      } else if (exifData.location) {
        parts.push(exifData.location)
      }
      if (exifData.timestamp) {
        parts.push(exifData.timestamp)
      }
      parts.push(`#${serialNumber}`)
      
      const text = parts.join('  |  ')
      const textWidth = ctx.measureText(text).width
      
      if (textWidth > img.width - padding * 2) {
        const scaleFactor = (img.width - padding * 2) / textWidth
        const scaledFontSize = Math.max(8, fontSize * scaleFactor)
        ctx.font = `${scaledFontSize}px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`
      }
      
      ctx.fillText(text, padding, img.height - barHeight / 2)
      
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url)
        resolve({
          blob,
          url: URL.createObjectURL(blob),
          width: img.width,
          height: img.height
        })
      }, 'image/jpeg', 0.95)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    
    img.src = url
  })
}

export function downloadSingle(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadZip(files) {
  const zip = new JSZip()
  const timestamp = getTimestampPrefix()
  
  for (let i = 0; i < files.length; i++) {
    const filename = `${timestamp}_${i + 1}.jpg`
    zip.file(filename, files[i])
  }
  
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `annotated_images_${timestamp}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function isImageTooLarge(file) {
  return file.size > 50 * 1024 * 1024
}