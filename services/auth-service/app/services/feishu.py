import httpx
from typing import Optional, Dict
from fastapi import HTTPException
from app.config import settings


class FeishuOAuthError(Exception):
    """Custom exception for Feishu OAuth errors."""
    pass


class FeishuOAuth:
    BASE_URL = "https://open.feishu.cn/open-apis"
    REQUEST_TIMEOUT = 10.0  # seconds

    def __init__(self):
        self.app_id = settings.feishu_app_id
        self.app_secret = settings.feishu_app_secret

    async def get_access_token(self, code: str) -> Optional[str]:
        url = f"{self.BASE_URL}/authen/v1/access_token"

        try:
            async with httpx.AsyncClient(timeout=self.REQUEST_TIMEOUT) as client:
                app_token_resp = await client.post(
                    f"{self.BASE_URL}/auth/v3/app_access_token/internal",
                    json={"app_id": self.app_id, "app_secret": self.app_secret}
                )
                app_token_resp.raise_for_status()
                app_token_data = app_token_resp.json()
                app_access_token = app_token_data.get("app_access_token")

                if not app_access_token:
                    return None

                resp = await client.post(
                    url,
                    json={"grant_type": "authorization_code", "code": code},
                    headers={"Authorization": f"Bearer {app_access_token}"}
                )
                resp.raise_for_status()
                data = resp.json()

                if data.get("code") == 0:
                    return data.get("data", {}).get("access_token")
                return None

        except httpx.TimeoutException:
            raise FeishuOAuthError("Feishu API request timeout")
        except httpx.HTTPStatusError as e:
            raise FeishuOAuthError(f"Feishu API HTTP error: {e.response.status_code}")
        except Exception as e:
            raise FeishuOAuthError(f"Feishu OAuth error: {str(e)}")

    async def get_user_info(self, access_token: str) -> Optional[Dict]:
        url = f"{self.BASE_URL}/authen/v1/user_info"

        try:
            async with httpx.AsyncClient(timeout=self.REQUEST_TIMEOUT) as client:
                resp = await client.get(url, headers={"Authorization": f"Bearer {access_token}"})
                resp.raise_for_status()
                data = resp.json()

                if data.get("code") == 0:
                    return data.get("data")
                return None

        except httpx.TimeoutException:
            raise FeishuOAuthError("Feishu API request timeout")
        except httpx.HTTPStatusError as e:
            raise FeishuOAuthError(f"Feishu API HTTP error: {e.response.status_code}")
        except Exception as e:
            raise FeishuOAuthError(f"Feishu OAuth error: {str(e)}")
