import { StravaApprovalPrompt, StravaScope } from '../enums'
import { StravaError } from '../errors'
import { SummaryAthlete } from '../models'
import { Request } from '../request'

export interface AuthorizationParams {
  mobile: boolean
  redirect_uri: string
  approval_prompt?: StravaApprovalPrompt
  scope?: StravaScope[] | string
  state?: string
}

export interface TokenExchangeError {
  error: "access_denied"
}

export interface TokenExchangeSuccess {
  code: string
  scope?: string
}

export interface TokenExchangeResponse {
  expires_at: number
  expires_in: number
  refresh_token: string
  access_token: string
  token_type: "Bearer"
  athlete: SummaryAthlete
}

export type TokenExchangeParams = TokenExchangeError & TokenExchangeSuccess;

export class Oauth {
  private readonly request: Request

  constructor(request: Request) {
    this.request = request
  }

  authorizeUrl(params: AuthorizationParams): string {
    const redirectBase = params.mobile ?
      "/oauth/mobile/authorize" :
      "/oauth/authorize"

    const redirect = new URL(redirectBase, "https://www.strava.com/")

    redirect.searchParams.append("response_type", "code");
    redirect.searchParams.append("client_id", this.request.config.client_id);
    redirect.searchParams.append("redirect_uri", params.redirect_uri);
    redirect.searchParams.append("approval_prompt", params.approval_prompt ?? "auto")
    if (params.state) {
      redirect.searchParams.append("state", params.state);
    }
    if (params.scope) {
      redirect.searchParams.append("scope", Array.isArray(params.scope) ? params.scope.join(",") : params.scope);
    }

    return redirect.toString()
  }

  async getToken(params: TokenExchangeParams): Promise<TokenExchangeResponse> {
    if (params.error) {
      throw new StravaError(null, params);
    }

    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "post",
      body: new URLSearchParams({
        client_id: this.request.config.client_id,
        client_secret: this.request.config.client_secret,
        code: params.code,
        grant_type: "authorization_code",
      })
    });

    if (!response.ok) {
      throw response
    }

    const tokenResponse = await response.json() as TokenExchangeResponse;
    this.request.config.refresh_token = tokenResponse.refresh_token;
    return tokenResponse;
  }

  async deauthorize(): Promise<void> {
    this.request.getAccessToken();
    await fetch(
      `https://www.strava.com/oauth/deauthorize?access_token=${this.request.response.access_token}`, {
      method: "post"
    });
  }
}
