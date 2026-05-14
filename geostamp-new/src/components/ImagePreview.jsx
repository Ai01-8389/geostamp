<<<<<<< HEAD
import { useState } from 'react'

export default function ImagePreview({ file, small }) {
  const [preview, setPreview] = useState(null)

  if (file && !preview) {
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  return (
    <div 
      className={`bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center ${
        small ? 'aspect-square' : 'aspect-[4/3]'
      }`}
    >
      {preview && (
        <img 
          src={preview} 
          alt={file?.name || 'Preview'}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  )
=======
import { useState } from 'react'

export default function ImagePreview({ file, small }) {
  const [preview, setPreview] = useState(null)

  if (file && !preview) {
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  return (
    <div 
      className={`bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center ${
        small ? 'aspect-square' : 'aspect-[4/3]'
      }`}
    >
      {preview && (
        <img 
          src={preview} 
          alt={file?.name || 'Preview'}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  )
>>>>>>> e4eba883a04c08465efdd112d57d260134d78910
}