import os

import requests
from dotenv import load_dotenv

from app.services.providers.base_provider import BaseProvider


load_dotenv()


URLHAUS_API_URL = "https://urlhaus-api.abuse.ch/v1/url/"


class URLHausProvider(BaseProvider):
    """
    URLHaus threat-intelligence provider.
    """

    def provider_name(self):
        return "URLHaus"

    def supports(self, ioc_type):
        """
        URLHaus supports URL indicators.
        """

        return ioc_type == "URL"

    def lookup(self, ioc, ioc_type):
        """
        Check a URL against URLHaus.
        """

        if not self.supports(ioc_type):
            return {
                "service_name": self.provider_name(),
                "status": "not_supported",
                "data": {},
                "message": (
                    f"URLHaus does not support "
                    f"IOC type: {ioc_type}"
                )
            }

        auth_key = (os.getenv("URLHAUS_AUTH_KEY") or "").strip()
        if not auth_key:
            return {
                "service_name": self.provider_name(),
                "status": "error",
                "data": {},
                "message": "URLHAUS_AUTH_KEY is not configured",
            }

        try:
            response = requests.post(
                URLHAUS_API_URL,
                headers={"Auth-Key": auth_key},
                data={"url": ioc},
                timeout=15,
            )
        except requests.RequestException as exc:
            return {
                "service_name": self.provider_name(),
                "status": "error",
                "data": {},
                "message": str(exc),
                "http_status": None,
            }

        try:
            raw_content = getattr(response, "content", None)
            if raw_content is not None and raw_content != b"":
                data = response.json()
            elif hasattr(response, "text") and response.text:
                data = response.json()
            else:
                data = {}
        except ValueError:
            data = {"raw_response": getattr(response, "text", "")}

        if response.status_code == 200:
            payload = dict(data or {})
            query_status = str(payload.get("query_status", "")).lower()
            is_positive = (
                query_status == "listed"
                or bool(payload.get("url"))
                or bool(payload.get("id"))
                or bool(payload.get("threat"))
            )

            # A valid URLHaus lookup that returns no positive evidence is still a
            # successful response to the API, but it is not threat-positive.
            return {
                "service_name": self.provider_name(),
                "status": "success",
                "data": payload,
                "http_status": response.status_code,
                "message": "URLHaus lookup completed successfully." if not is_positive else None,
            }

        return {
            "service_name": self.provider_name(),
            "status": "error",
            "data": data,
            "http_status": response.status_code,
            "message": data.get("message") if isinstance(data, dict) else "URLHaus request failed.",
        }