<<<<<<< HEAD
import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { extractExifData, reverseGeocode, processImage, downloadSingle, downloadZip, getSerialForDate, isImageTooLarge } from '../utils/imageProcessor'
import UploadArea from '../components/UploadArea'
import ImagePreview from '../components/ImagePreview'
import ProcessedPreview from '../components/ProcessedPreview'

export default function Dashboard() {
  const { t } = useTranslation()
  const [files, setFiles] = useState([])
  const [processedImages, setProcessedImages] = useState([])
  const [prefix, setPrefix] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [largeImageWarning, setLargeImageWarning] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const isSub = localStorage.getItem('isSubscriber') === 'true'
    const email = localStorage.getItem('userEmail')
    
    if (!isSub) {
      navigate('/pricing')
      return
    }
    
    setUserEmail(email || '')
  }, [navigate])

  const handleFilesSelected = useCallback((selectedFiles) => {
    const fileArray = Array.from(selectedFiles)
    setProcessedImages([])
    
    const hasLargeImage = fileArray.some(isImageTooLarge)
    setLargeImageWarning(hasLargeImage)
    
    setFiles(fileArray)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFilesSelected(droppedFiles)
    }
  }, [handleFilesSelected])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('isSubscriber')
    localStorage.removeItem('userEmail')
    navigate('/')
  }

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

  const handleDownloadAll = async () => {
    const blobs = processedImages.map(img => img.blob)
    await downloadZip(blobs)
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-text-gray">{t('dashboard.heading')}</h1>
              <p className="text-gray-500 text-sm mt-1">{userEmail}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                {t('dashboard.proMember')}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-text-gray transition-colors"
              >
                {t('dashboard.signOut')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-text-gray mb-2">{t('dashboard.batchHeading')}</h2>
          <p className="text-gray-500">{t('dashboard.batchDesc')}</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-8 md:p-12 mb-8">
          {largeImageWarning && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-orange-800 text-sm">{t('errors.imageTooLarge')}</p>
            </div>
          )}

          {showLoadingIndicator && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-800 text-sm font-medium">{t('upload.loadingPlaceName')}</span>
            </div>
          )}

          <UploadArea
            onDrop={handleDrop}
            onFileSelect={handleFilesSelected}
            files={files}
            t={t}
          />

          {files.length > 0 && (
            <div className="mt-8">
              <div className="max-w-xs mx-auto mb-6">
                <label className="block text-sm font-medium text-text-gray mb-1.5 text-center">
                  {t('dashboard.prefixLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('dashboard.prefixPlaceholder')}
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-brand-black"
                />
                <p className="text-sm text-gray-400 mt-2 text-center">
                  {t('dashboard.prefixHint')}
                </p>
              </div>

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

              {!processedImages.length && (
                <>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
                    {files.slice(0, 12).map((file, index) => (
                      <ImagePreview key={index} file={file} small />
                    ))}
                    {files.length > 12 && (
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">+{files.length - 12} more</span>
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
                </>
              )}

              {processedImages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-gray mb-4">
                    {t('features.step3.title')}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {processedImages.map((img, index) => (
                      <ProcessedPreview
                        key={index}
                        image={img}
                        onDownload={() => downloadSingle(img.blob, `${prefix || 'annotated'}${index + 1}.jpg`)}
                        t={t}
                      />
                    ))}
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={handleDownloadAll}
                      className="bg-brand-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                      {t('upload.downloadZipButton')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-text-gray mb-4">{t('dashboard.usageTips')}</h3>
          <ul className="space-y-2 text-gray-500 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-brand-black">→</span>
              {t('dashboard.tip1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-black">→</span>
              {t('dashboard.tip2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-black">→</span>
              {t('dashboard.tip3')}
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
=======
import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { extractExifData, reverseGeocode, processImage, downloadSingle, downloadZip, getSerialForDate, isImageTooLarge } from '../utils/imageProcessor'
import UploadArea from '../components/UploadArea'
import ImagePreview from '../components/ImagePreview'
import ProcessedPreview from '../components/ProcessedPreview'

export default function Dashboard() {
  const { t } = useTranslation()
  const [files, setFiles] = useState([])
  const [processedImages, setProcessedImages] = useState([])
  const [prefix, setPrefix] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [largeImageWarning, setLargeImageWarning] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const isSub = localStorage.getItem('isSubscriber') === 'true'
    const email = localStorage.getItem('userEmail')
    
    if (!isSub) {
      navigate('/pricing')
      return
    }
    
    setUserEmail(email || '')
  }, [navigate])

  const handleFilesSelected = useCallback((selectedFiles) => {
    const fileArray = Array.from(selectedFiles)
    setProcessedImages([])
    
    const hasLargeImage = fileArray.some(isImageTooLarge)
    setLargeImageWarning(hasLargeImage)
    
    setFiles(fileArray)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFilesSelected(droppedFiles)
    }
  }, [handleFilesSelected])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('isSubscriber')
    localStorage.removeItem('userEmail')
    navigate('/')
  }

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

  const handleDownloadAll = async () => {
    const blobs = processedImages.map(img => img.blob)
    await downloadZip(blobs)
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-text-gray">{t('dashboard.heading')}</h1>
              <p className="text-gray-500 text-sm mt-1">{userEmail}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                {t('dashboard.proMember')}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-text-gray transition-colors"
              >
                {t('dashboard.signOut')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-text-gray mb-2">{t('dashboard.batchHeading')}</h2>
          <p className="text-gray-500">{t('dashboard.batchDesc')}</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-8 md:p-12 mb-8">
          {largeImageWarning && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-orange-800 text-sm">{t('errors.imageTooLarge')}</p>
            </div>
          )}

          {showLoadingIndicator && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-800 text-sm font-medium">{t('upload.loadingPlaceName')}</span>
            </div>
          )}

          <UploadArea
            onDrop={handleDrop}
            onFileSelect={handleFilesSelected}
            files={files}
            t={t}
          />

          {files.length > 0 && (
            <div className="mt-8">
              <div className="max-w-xs mx-auto mb-6">
                <label className="block text-sm font-medium text-text-gray mb-1.5 text-center">
                  {t('dashboard.prefixLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('dashboard.prefixPlaceholder')}
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-brand-black"
                />
                <p className="text-sm text-gray-400 mt-2 text-center">
                  {t('dashboard.prefixHint')}
                </p>
              </div>

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

              {!processedImages.length && (
                <>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
                    {files.slice(0, 12).map((file, index) => (
                      <ImagePreview key={index} file={file} small />
                    ))}
                    {files.length > 12 && (
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">+{files.length - 12} more</span>
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
                </>
              )}

              {processedImages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-gray mb-4">
                    {t('features.step3.title')}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {processedImages.map((img, index) => (
                      <ProcessedPreview
                        key={index}
                        image={img}
                        onDownload={() => downloadSingle(img.blob, `${prefix || 'annotated'}${index + 1}.jpg`)}
                        t={t}
                      />
                    ))}
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={handleDownloadAll}
                      className="bg-brand-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                      {t('upload.downloadZipButton')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-text-gray mb-4">{t('dashboard.usageTips')}</h3>
          <ul className="space-y-2 text-gray-500 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-brand-black">→</span>
              {t('dashboard.tip1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-black">→</span>
              {t('dashboard.tip2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-black">→</span>
              {t('dashboard.tip3')}
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
>>>>>>> e4eba883a04c08465efdd112d57d260134d78910
}