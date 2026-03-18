// ═══════════════════════════════════════════════════════════════════════════
// CITY FLEET — Supabase Storage (Photo/Video Upload)
// Location: src/lib/supabase/storage.ts
// Controls: D-03 (evidence mandatory), I-01 (original evidence retained)
// Saves under job in relevant area: safety | diagnosis | defects | odometer | completion
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from '@/lib/supabase/client'

/** Supabase Storage bucket for job photos/videos (create in Dashboard + RLS) */
export const JOB_ATTACHMENTS_BUCKET = 'job-attachments'

export type AttachmentArea = 'walkaround' | 'safety' | 'diagnosis' | 'defects' | 'odometer' | 'completion' | 'general'

/**
 * Upload a file to Supabase Storage under the job and area.
 * Returns storage path and public URL; path is stored in job_attachments.file_path.
 */
export async function uploadJobAttachment(params: {
  jobId: string
  userId: string
  file: File
  area: AttachmentArea
  category?: string
}): Promise<{ path: string; url: string } | { path: null; url: null; error: string }> {
  try {
    const supabase = createClient()
    const timestamp = Date.now()
    const ext = params.file.name.split('.').pop() || 'jpg'
    const path = `${params.jobId}/${params.area}/${params.category || 'general'}/${timestamp}.${ext}`

    const { error: uploadError } = await (supabase.storage as any)
      .from(JOB_ATTACHMENTS_BUCKET)
      .upload(path, params.file, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from(JOB_ATTACHMENTS_BUCKET)
      .getPublicUrl(path)

    return { path, url: urlData.publicUrl }
  } catch (err: any) {
    return { path: null, url: null, error: err.message || 'Upload failed' }
  }
}

/**
 * Upload from base64 data URL (camera capture on phone).
 */
export async function uploadBase64JobAttachment(params: {
  jobId: string
  userId: string
  dataUrl: string
  area: AttachmentArea
  category?: string
}): Promise<{ path: string; url: string } | { path: null; url: null; error: string }> {
  try {
    const response = await fetch(params.dataUrl)
    const blob = await response.blob()
    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
    return uploadJobAttachment({ ...params, file })
  } catch (err: any) {
    return { path: null, url: null, error: err.message || 'Upload failed' }
  }
}

/**
 * Create job_attachments row (links file to job; schema: file_path, file_type, file_size_bytes, uploaded_by).
 */
export async function createJobAttachmentRecord(params: {
  jobId: string
  uploadedBy: string
  filePath: string
  fileType?: string
  fileSizeBytes?: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { error: insertError } = await (supabase as any)
      .from('job_attachments')
      .insert({
        job_id: params.jobId,
        file_path: params.filePath,
        file_type: params.fileType || 'image/jpeg',
        file_size_bytes: params.fileSizeBytes ?? null,
        uploaded_by: params.uploadedBy,
      })
    if (insertError) throw insertError
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/** @deprecated Use uploadJobAttachment + createJobAttachmentRecord */
export async function uploadEvidence(params: {
  jobId: string
  userId: string
  file: File
  stage: 'pre' | 'during' | 'post'
  category?: string
}): Promise<{ url: string | null; error: string | null }> {
  const area = params.stage === 'pre' ? 'safety' : params.stage === 'post' ? 'completion' : 'diagnosis'
  const result = await uploadJobAttachment({
    jobId: params.jobId,
    userId: params.userId,
    file: params.file,
    area,
    category: params.category,
  })
  if (result.path) return { url: result.url, error: null }
  return { url: null, error: ('error' in result ? result.error : null) ?? 'Upload failed' }
}

/** @deprecated Use uploadBase64JobAttachment */
export async function uploadBase64Evidence(params: {
  jobId: string
  userId: string
  dataUrl: string
  stage: 'pre' | 'during' | 'post'
  category?: string
}): Promise<{ url: string | null; error: string | null }> {
  const area = params.stage === 'pre' ? 'safety' : params.stage === 'post' ? 'completion' : 'diagnosis'
  const result = await uploadBase64JobAttachment({ ...params, area })
  if (result.path) return { url: result.url, error: null }
  return { url: null, error: ('error' in result ? result.error : null) ?? 'Upload failed' }
}
