
import fetch, { BodyInit } from 'node-fetch'
import { StravaError } from './errors'
import { RefreshTokenRequest, RefreshTokenResponse } from './types'

type RequestParams = {
  query?: any
  body?: BodyInit|{[k: string]: unknown}
}

export class Request {
  config: RefreshTokenRequest
  response: RefreshTokenResponse

  constructor(config: RefreshTokenRequest) {
    this.config = config
  }

  async getAccessToken(): Promise<RefreshTokenResponse> {
    if (
      !this.response ||
      this.response?.expires_at < new Date().getTime() / 1000
    ) {
      const response = await fetch(
        `https://www.strava.com/oauth/token`,
        {
          method: 'post',
          body: new URLSearchParams({
            client_id: this.config.client_id,
            client_secret: this.config.client_secret,
            refresh_token: this.config.refresh_token,
            grant_type: 'refresh_token',
          }),
        },
      )

      if (!response.ok) {
        throw response
      }

      this.response = await response.json()
    }
    return this.response
  }

  getFetchBody(params?: RequestParams): BodyInit {
    if (!params?.body) {
      return null
    }

    const body = params.body;
    if (body === null || typeof body !== 'object') {
      return params.body as BodyInit
    }
    const proto = Object.getPrototypeOf(body);
    if (proto === null) {
      return new URLSearchParams(body as Record<string, string>)
    }

    const Ctor = proto.hasOwnProperty("constructor") && proto.constructor;
    if (typeof Ctor === "function" && Ctor instanceof Ctor && Ctor.toString() === "[object Object]") {
      return new URLSearchParams(body as Record<string, string>)
    }

    return body as BodyInit
  }

  public async makeApiRequest<Response>(
    method: string,
    uri: string,
    params?: RequestParams,
  ): Promise<Response> {
    try {
      await this.getAccessToken()

      const query: string = new URLSearchParams(params?.query).toString()
      const response = await fetch(
        `https://www.strava.com/api/v3${uri}?${query}`,
        {
          body: this.getFetchBody(params),
          method,
          headers: {
            Authorization: `Bearer ${this.response.access_token}`,
          },
        },
      )

      if (!response.ok) {
        throw response
      }

      if (response.status !== 204) {
        return await response.json()
      }
    } catch (error) {
      const data = await error.json()
      switch (error.status) {
        case 400:
        case 401:
        case 403:
        case 404:
        case 429:
        case 500:
          throw new StravaError(error, data)
        default:
          throw error
      }
    }
  }
}
