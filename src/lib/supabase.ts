import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper para obtener URL de imágenes en Supabase Storage
export const getImageUrl = (path: string, bucket: string = 'discos-images') => {
  return `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/${bucket}/${path}`
}

// Helper para subir imagen a Supabase Storage
export const uploadImage = async (
  file: File,
  bucket: string = 'discos-images',
  customPath?: string
): Promise<string> => {
  const fileName = customPath || `${Date.now()}_${file.name}`
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error
  
  return data.path
}

// Helper para eliminar imagen de Supabase Storage
export const deleteImage = async (
  path: string,
  bucket: string = 'discos-images'
): Promise<void> => {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}
