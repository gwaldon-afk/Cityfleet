// ═══════════════════════════════════════════════════════════════════════════
// CITY FLEET — Supabase Storage (Photo/File Upload)
// Location: src/lib/supabase/storage.ts
// Controls: D-03 (evidence mandatory), I-01 (original evidence retained)
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from '@/lib/supabase/client'

const BUCKET = 'job-evidence'

/**
 * Upload a file to Supabase Storage — returns the public URL
 */
export async function uploadEvidence(params: {
  jobId: string
  userId: string
  file: File
  stage: 'pre' | 'during' | 'post'
  category?: string
}): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = createClient()
    const timestamp = Date.now()
    const ext = params.file.name.split('.').pop() || 'jpg'
    const filePath = `${params.jobId}/${params.stage}/${params.category || 'general'}/${timestamp}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, params.file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath)

    return { url: urlData.publicUrl, error: null }
  } catch (err: any) {
    return { url: null, error: err.message || 'Upload failed' }
  }
}

/**
 * Upload a base64 data URL (from camera capture)
 */
export async function uploadBase64Evidence(params: {
  jobId: string
  userId: string
  dataUrl: string
  stage: 'pre' | 'during' | 'post'
  category?: string
}): Promise<{ url: string | null; error: string | null }> {
  try {
    const response = await fetch(params.dataUrl)
    const blob = await response.blob()
    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
    return uploadEvidence({ ...params, file })
  } catch (err: any) {
    return { url: null, error: err.message || 'Upload failed' }
  }
}

/**
 * Create a job attachment record (links uploaded file to job)
 */
export async function createAttachmentRecord(params: {
  jobId: string
  userId: string
  fileUrl: string
  stage: 'pre' | 'during' | 'post'
  fileType?: string
  description?: string
  ocrText?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('job_attachments')
      .insert({
        job_id: params.jobId,
        user_id: params.userId,
        stage: params.stage,
        file_url: params.fileUrl,
        file_type: params.fileType || 'image/jpeg',
        description: params.description || null,
        ocr_text: params.ocrText || null,
      })

    if (insertError) throw insertError
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
