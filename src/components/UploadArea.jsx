import { useState } from 'react'

export default function UploadArea({ onDrop, onFileSelect, files, t }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDropEvent = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      onDrop(e)
    }
  }

  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'image/*'
    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        onFileSelect(e.target.files)
      }
    }
    input.click()
  }

  return (
    <div
      className={`drop-zone rounded-2xl p-12 text-center cursor-pointer transition-all ${
        isDragging ? 'active' : ''
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDropEvent}
      onClick={handleClick}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        id="file-upload"
        onChange={(e) => {
          if (e.target.files.length > 0) {
            onFileSelect(e.target.files)
          }
        }}
      />
      
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      
      {files.length === 0 ? (
        <>
          <h3 className="text-lg font-semibold text-text-gray mb-2">
            {t('upload.dropZone')}
          </h3>
          <p className="text-gray-500">
            {t('upload.clickBrowse')}
          </p>
        </>
      ) : (
        <p className="text-text-gray font-medium">
          {t('upload.selected', { count: files.length })}
        </p>
      )}
    </div>
  )
}