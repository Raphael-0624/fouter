import httpx
from typing import Optional, Dict
from app.config import settings


class FeishuOAuth:
    BASE_URL = "https://open.feishu.cn/open-apis"

    def __init__(self):
        self.app_id = settings.feishu_app_id
        self.app_secret = settings.feishu_app_secret

    async def get_access_token(self, code: str) -> Optional[str]:
        url = f"{self.BASE_URL}/authen/v1/access_token"

        async with httpx.AsyncClient() as client:
            app_token_resp = await client.post(
                f"{self.BASE_URL}/auth/v3/app_access_token/internal",
                json={"app_id": self.app_id, "app_secret": self.app_secret}
            )
            app_token_data = app_token_resp.json()
            app_access_token = app_token_data.get("app_access_token")

            if not app_access_token:
                return None

            resp = await client.post(
                url, json={"grant_type": "authorization_code", "code": code},
                headers={"Authorization": f"Bearer {app_access_token}"}
            )
            data = resp.json()

            if data.get("code") == 0:
                return data.get("data", {}).get("access_token")
            return None

    async def get_user_info(self, access_token: str) -> Optional[Dict]:
        url = f"{self.BASE_URL}/authen/v1/user_info"

        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers={"Authorization": f"Bearer {access_token}"})
            data = resp.json()

            if data.get("code") == 0:
                return data.get("data")
            return None
