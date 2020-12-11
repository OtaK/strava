import { Blob } from 'node-fetch'

import { Upload } from '../models'
import { Request } from '../request'
import Blob from 'fetch-blob'
import FormData from 'form-data'

type createUploadRequest = {
  file: Blob
  name: string
  description: string
  trainer: string
  commute: string
  data_type: 'fit' | 'fit.gz' | 'tcx' | 'tcx.gz' | 'gpx' | 'gpx.gz'
  external_id: string
}

type GetUploadByIdRequest = {
  uploadId: number
}

export class Uploads {
  private readonly request: Request

  constructor(request) {
    this.request = request
  }

  async createUpload(params: createUploadRequest): Promise<Upload> {
    const formData = new FormData()
    for (const [k, v] of Object.entries(params)) {
      formData.append(k, v)
    }
    return await this.request.makeApiRequest<Upload>('post', '/uploads', {
      body: formData,
    }, false)
  }

  async getUploadById(params: GetUploadByIdRequest): Promise<Upload> {
    const { uploadId } = params
    return await this.request.makeApiRequest<Upload>(
      'get',
      `/uploads/${uploadId}`,
    )
  }
}
