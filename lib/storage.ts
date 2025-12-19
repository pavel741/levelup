import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized')
  }

  const avatarRef = ref(storage, `avatars/${userId}`)

  await uploadBytes(avatarRef, file, {
    contentType: file.type,
  })

  const downloadUrl = await getDownloadURL(avatarRef)
  return downloadUrl
}


