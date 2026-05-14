<<<<<<< HEAD
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { extractExifData, reverseGeocode, processImage, downloadSingle, downloadZip, getSerialForDate, getTimestampPrefix, isImageTooLarge } from '../utils/imageProcessor'
import UploadArea from '../components/UploadArea'
import ImagePreview from '../components/ImagePreview'
import ProcessedPreview from '../components/ProcessedPreview'

export default function Home() {
  const { t, i18n } = useTranslation()
  const [files, setFiles] = useState([])
  const [processedImages, setProcessedImages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [largeImageWarning, setLargeImageWarning] = useState(false)
  const [isSubscriber, setIsSubscriber] = useState(false)
  const navigate = useNavigate()

  useState(() => {
    const subStatus = localStorage.getItem('isSubscriber') === 'true'
    setIsSubscriber(subStatus)
  }, [])

  const handleFilesSelected = useCallback((selectedFiles) => {
    const fileArray = Array.from(selectedFiles)
    setProcessedImages([])
    
    const hasLargeImage = fileArray.some(isImageTooLarge)
    setLargeImageWarning(hasLargeImage)
    
    if (fileArray.length > 1 && !isSubscriber) {
      navigate('/pricing')
      return
    }
    
    setFiles(fileArray)
  }, [isSubscriber, navigate])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFilesSelected(droppedFiles)
    }
  }, [handleFilesSelected])

  const handleProcess = async () => {
    if (files.length === 0) return
    
    setIsProcessing(true)
    setProcessedImages([])
    
    try {
      const results = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const exifData = await extractExifData(file)
        
        if (exifData.gps) {
          setShowLoadingIndicator(true)
          const placeName = await reverseGeocode(exifData.gps.lat, exifData.gps.lng)
          exifData.placeName = placeName
          setShowLoadingIndicator(false)
        }
        
        const serialNumber = getSerialForDate()
        const processed = await processImage(file, exifData, serialNumber)
        
        if (processed) {
          results.push({
            ...processed,
            originalName: file.name,
            exifData
          })
        }
        
        setProcessedCount(i + 1)
      }
      
      setProcessedImages(results)
      
    } catch (error) {
      console.error('Processing failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadSingle = (blob) => {
    const filename = `${getTimestampPrefix()}_1.jpg`
    downloadSingle(blob, filename)
  }

  const handleDownloadAll = async () => {
    const blobs = processedImages.map(img => img.blob)
    await downloadZip(blobs)
  }

  return (
    <div className={`min-h-screen bg-white ${i18n.language === 'ar' ? 'text-right' : ''}`}>
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-semibold text-text-gray tracking-tight mb-6">
            {t('hero.heading')}
          </h1>
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            {t('hero.subheading')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => document.getElementById('file-input')?.click()}
              className="bg-brand-black text-white px-6 py-3 text-base font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              {t('hero.uploadButton')}
            </button>
            <a 
              href="#features"
              className="text-text-gray px-6 py-3 text-base font-medium hover:text-brand-black transition-colors"
            >
              {t('hero.learnMore')}
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm font-medium">
              {t('privacy.message')}
            </p>
          </div>

          {largeImageWarning && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-orange-800 text-sm">
                {t('errors.imageTooLarge')}
              </p>
            </div>
          )}

          {showLoadingIndicator && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-800 text-sm font-medium">
                {t('upload.loadingPlaceName')}
              </span>
            </div>
          )}

          <UploadArea 
            onDrop={handleDrop}
            onFileSelect={handleFilesSelected}
            files={files}
            t={t}
          />

          {files.length > 0 && !processedImages.length && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">
                  {files.length} {files.length === 1 ? 'image' : 'images'} selected
                </span>
                {isProcessing && (
                  <span className="text-sm text-gray-500">
                    {t('upload.processing', { processed: processedCount, total: files.length })}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {files.slice(0, 4).map((file, index) => (
                  <ImagePreview key={index} file={file} />
                ))}
                {files.length > 4 && (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-sm">+{files.length - 4} more</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="bg-brand-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? `${t('upload.processing', { processed: processedCount, total: files.length })}` : t('upload.annotateButton')}
                </button>
              </div>
            </div>
          )}

          {processedImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-text-gray mb-4">
                {t('features.step3.title')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {processedImages.map((img, index) => (
                  <ProcessedPreview 
                    key={index} 
                    image={img} 
                    onDownload={() => handleDownloadSingle(img.blob)}
                    t={t}
                  />
                ))}
              </div>
              
              <div className="flex justify-center gap-4">
                {processedImages.length === 1 ? (
                  <button
                    onClick={() => handleDownloadSingle(processedImages[0].blob)}
                    className="bg-brand-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    {t('upload.downloadButton')}
                  </button>
                ) : (
                  <button
                    onClick={handleDownloadAll}
                    className="bg-brand-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    {t('upload.downloadZipButton')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold text-text-gray text-center mb-16">
          {t('features.heading')}
        </h2>
        
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-xl font-semibold text-brand-black">1</span>
            </div>
            <h3 className="text-lg font-semibold text-text-gray mb-2">
              {t('features.step1.title')}
            </h3>
            <p className="text-gray-500 leading-relaxed">
              {t('features.step1.desc')}
            </p>
          </div>
          
          <div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-xl font-semibold text-brand-black">2</span>
            </div>
            <h3 className="text-lg font-semibold text-text-gray mb-2">
              {t('features.step2.title')}
            </h3>
            <p className="text-gray-500 leading-relaxed">
              {t('features.step2.desc')}
            </p>
          </div>
          
          <div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-xl font-semibold text-brand-black">3</span>
            </div>
            <h3 className="text-lg font-semibold text-text-gray mb-2">
              {t('features.step3.title')}
            </h3>
            <p className="text-gray-500 leading-relaxed">
              {t('features.step3.desc')}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-gray-100">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-semibold text-text-gray mb-4">
              {t('beforeAfter.heading')}
            </h2>
            <p className="text-gray-500 leading-relaxed">
              {t('tagline')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 rounded-lg aspect-[4/3] flex items-center justify-center relative">
              <span className="text-gray-400 text-sm">{t('beforeAfter.original')}</span>
              <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded">
                {t('beforeAfter.original')}
              </span>
            </div>
            <div className="bg-gray-100 rounded-lg aspect-[4/3] flex items-center justify-center relative">
              <span className="text-gray-400 text-sm">{t('beforeAfter.annotated')}</span>
              <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded">
                {t('beforeAfter.annotated')}
              </span>
              <div className="absolute bottom-3 left-3 right-3 bg-black/70 text-white text-xs px-3 py-2 rounded">
                Shanghai Bund | 2024:01:15 10:30:00 | #1
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <h2 className="text-3xl font-semibold text-text-gray mb-2">
            {t('desktopApp.heading')}
          </h2>
          <p className="text-xl text-gray-500 mb-4">
            {t('desktopApp.subheading')}
          </p>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {t('desktopApp.description')}
          </p>
          <button className="bg-gray-100 text-text-gray px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            {t('desktopApp.notifyMe')}
          </button>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="6" fill="#000"/>
              <path d="M8 12h16M8 16h12M8 20h14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="22" cy="22" r="4" fill="#fff"/>
            </svg>
            <span className="font-medium text-text-gray">GeoStamp</span>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-gray-500">
            <Link to="/pricing" className="hover:text-text-gray transition-colors">
              {t('nav.pricing')}
            </Link>
            <Link to="/login" className="hover:text-text-gray transition-colors">
              {t('nav.login')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
=======
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { extractExifData, reverseGeocode, processImage, downloadSingle, downloadZip, getSerialForDate, getTimestampPrefix, isImageTooLarge } from '../utils/imageProcessor'
import UploadArea from '../components/UploadArea'
import ImagePreview from '../components/ImagePreview'
import ProcessedPreview from '../components/ProcessedPreview'

export default function Home() {
  const { t, i18n } = useTranslation()
  const [files, setFiles] = useState([])
  const [processedImages, setProcessedImages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [largeImageWarning, setLargeImageWarning] = useState(false)
  const [isSubscriber, setIsSubscriber] = useState(false)
  const navigate = useNavigate()

  useState(() => {
    const subStatus = localStorage.getItem('isSubscriber') === 'true'
    setIsSubscriber(subStatus)
  }, [])

  const handleFilesSelected = useCallback((selectedFiles) => {
    const fileArray = Array.from(selectedFiles)
    setProcessedImages([])
    
    const hasLargeImage = fileArray.some(isImageTooLarge)
    setLargeImageWarning(hasLargeImage)
    
    if (fileArray.length > 1 && !isSubscriber) {
      navigate('/pricing')
      return
    }
    
    setFiles(fileArray)
  }, [isSubscriber, navigate])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFilesSelected(droppedFiles)
    }
  }, [handleFilesSelected])

  const handleProcess = async () => {
    if (files.length === 0) return
    
    setIsProcessing(true)
    setProcessedImages([])
    
    try {
      const results = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const exifData = await extractExifData(file)
        
        if (exifData.gps) {
          setShowLoadingIndicator(true)
          const placeName = await reverseGeocode(exifData.gps.lat, exifData.gps.lng)
          exifData.placeName = placeName
          setShowLoadingIndicator(false)
        }
        
        const serialNumber = getSerialForDate()
        const processed = await processImage(file, exifData, serialNumber)
        
        if (processed) {
          results.push({
            ...processed,
            originalName: file.name,
            exifData
          })
        }
        
        setProcessedCount(i + 1)
      }
      
      setProcessedImages(results)
      
    } catch (error) {
      console.error('Processing failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadSingle = (blob) => {
    const filename = `${getTimestampPrefix()}_1.jpg`
    downloadSingle(blob, filename)
  }

  const handleDownloadAll = async () => {
    const blobs = processedImages.map(img => img.blob)
    await downloadZip(blobs)
  }

  return (
    <div className={`min-h-screen bg-white ${i18n.language === 'ar' ? 'text-right' : ''}`}>
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-semibold text-text-gray tracking-tight mb-6">
            {t('hero.heading')}
          </h1>
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            {t('hero.subheading')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => document.getElementById('file-input')?.click()}
              className="bg-brand-black text-white px-6 py-3 text-base font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              {t('hero.uploadButton')}
            </button>
            <a 
              href="#features"
              className="text-text-gray px-6 py-3 text-base font-medium hover:text-brand-black transition-colors"
            >
              {t('hero.learnMore')}
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm font-medium">
              {t('privacy.message')}
            </p>
          </div>

          {largeImageWarning && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-orange-800 text-sm">
                {t('errors.imageTooLarge')}
              </p>
            </div>
          )}

          {showLoadingIndicator && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-800 text-sm font-medium">
                {t('upload.loadingPlaceName')}
              </span>
            </div>
          )}

          <UploadArea 
            onDrop={handleDrop}
            onFileSelect={handleFilesSelected}
            files={files}
            t={t}
          />

          {files.length > 0 && !processedImages.length && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">
                  {files.length} {files.length === 1 ? 'image' : 'images'} selected
                </span>
                {isProcessing && (
                  <span className="text-sm text-gray-500">
                    {t('upload.processing', { processed: processedCount, total: files.length })}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {files.slice(0, 4).map((file, index) => (
                  <ImagePreview key={index} file={file} />
                ))}
                {files.length > 4 && (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-sm">+{files.length - 4} more</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="bg-brand-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? `${t('upload.processing', { processed: processedCount, total: files.length })}` : t('upload.annotateButton')}
                </button>
              </div>
            </div>
          )}

          {processedImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-text-gray mb-4">
                {t('features.step3.title')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {processedImages.map((img, index) => (
                  <ProcessedPreview 
                    key={index} 
                    image={img} 
                    onDownload={() => handleDownloadSingle(img.blob)}
                    t={t}
                  />
                ))}
              </div>
              
              <div className="flex justify-center gap-4">
                {processedImages.length === 1 ? (
                  <button
                    onClick={() => handleDownloadSingle(processedImages[0].blob)}
                    className="bg-brand-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    {t('upload.downloadButton')}
                  </button>
                ) : (
                  <button
                    onClick={handleDownloadAll}
                    className="bg-brand-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    {t('upload.downloadZipButton')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold text-text-gray text-center mb-16">
          {t('features.heading')}
        </h2>
        
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-xl font-semibold text-brand-black">1</span>
            </div>
            <h3 className="text-lg font-semibold text-text-gray mb-2">
              {t('features.step1.title')}
            </h3>
            <p className="text-gray-500 leading-relaxed">
              {t('features.step1.desc')}
            </p>
          </div>
          
          <div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-xl font-semibold text-brand-black">2</span>
            </div>
            <h3 className="text-lg font-semibold text-text-gray mb-2">
              {t('features.step2.title')}
            </h3>
            <p className="text-gray-500 leading-relaxed">
              {t('features.step2.desc')}
            </p>
          </div>
          
          <div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-xl font-semibold text-brand-black">3</span>
            </div>
            <h3 className="text-lg font-semibold text-text-gray mb-2">
              {t('features.step3.title')}
            </h3>
            <p className="text-gray-500 leading-relaxed">
              {t('features.step3.desc')}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-gray-100">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-semibold text-text-gray mb-4">
              {t('beforeAfter.heading')}
            </h2>
            <p className="text-gray-500 leading-relaxed">
              {t('tagline')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 rounded-lg aspect-[4/3] flex items-center justify-center relative">
              <span className="text-gray-400 text-sm">{t('beforeAfter.original')}</span>
              <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded">
                {t('beforeAfter.original')}
              </span>
            </div>
            <div className="bg-gray-100 rounded-lg aspect-[4/3] flex items-center justify-center relative">
              <span className="text-gray-400 text-sm">{t('beforeAfter.annotated')}</span>
              <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded">
                {t('beforeAfter.annotated')}
              </span>
              <div className="absolute bottom-3 left-3 right-3 bg-black/70 text-white text-xs px-3 py-2 rounded">
                Shanghai Bund | 2024:01:15 10:30:00 | #1
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <h2 className="text-3xl font-semibold text-text-gray mb-2">
            {t('desktopApp.heading')}
          </h2>
          <p className="text-xl text-gray-500 mb-4">
            {t('desktopApp.subheading')}
          </p>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {t('desktopApp.description')}
          </p>
          <button className="bg-gray-100 text-text-gray px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            {t('desktopApp.notifyMe')}
          </button>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="6" fill="#000"/>
              <path d="M8 12h16M8 16h12M8 20h14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="22" cy="22" r="4" fill="#fff"/>
            </svg>
            <span className="font-medium text-text-gray">GeoStamp</span>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-gray-500">
            <Link to="/pricing" className="hover:text-text-gray transition-colors">
              {t('nav.pricing')}
            </Link>
            <Link to="/login" className="hover:text-text-gray transition-colors">
              {t('nav.login')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
>>>>>>> e4eba883a04c08465efdd112d57d260134d78910
}