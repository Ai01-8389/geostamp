<<<<<<< HEAD
export default function ProcessedPreview({ image, onDownload, t }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <div className="relative aspect-[4/3] bg-gray-100">
        <img 
          src={image.url} 
          alt={image.originalName || 'Processed'}
          className="w-full h-full object-contain"
        />
        <button
          onClick={onDownload}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium text-text-gray hover:bg-white transition-colors shadow-sm"
        >
          {t('upload.downloadButton')}
        </button>
      </div>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 truncate max-w-[70%]">
            {image.originalName}
          </span>
          <span className="text-xs text-gray-400">
            {image.width} × {image.height}
          </span>
        </div>
      </div>
    </div>
  )
=======
export default function ProcessedPreview({ image, onDownload, t }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <div className="relative aspect-[4/3] bg-gray-100">
        <img 
          src={image.url} 
          alt={image.originalName || 'Processed'}
          className="w-full h-full object-contain"
        />
        <button
          onClick={onDownload}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium text-text-gray hover:bg-white transition-colors shadow-sm"
        >
          {t('upload.downloadButton')}
        </button>
      </div>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 truncate max-w-[70%]">
            {image.originalName}
          </span>
          <span className="text-xs text-gray-400">
            {image.width} × {image.height}
          </span>
        </div>
      </div>
    </div>
  )
>>>>>>> e4eba883a04c08465efdd112d57d260134d78910
}