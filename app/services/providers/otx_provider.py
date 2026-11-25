import os
import requests

from dotenv import load_dotenv

from app.services.providers.base_provider import BaseProvider


load_dotenv()


OTX_API_URL = "https://otx.alienvault.com/api/v1"


class OTXProvider(BaseProvider):
    """
    AlienVault Open Threat Exchange (OTX) provider.
    """

    def provider_name(self):
        """
        Return the provider name.
        """

        return "AlienVault OTX"

    def supports(self, ioc_type):
        """
        Return True for IOC types supported by OTX.
        """

        supported_types = {
            "IP",
            "DOMAIN",
            "URL",
            "MD5",
            "SHA1",
            "SHA256"
        }

        return ioc_type in supported_types

    def _get_api_key(self):
        """
        Get the OTX API key from the environment.
        """

        return os.getenv("OTX_API_KEY")

    def _get_endpoint(self, ioc, ioc_type):
        """
        Build the OTX endpoint for the IOC type.
        """

        if ioc_type == "IP":
            return (
                f"{OTX_API_URL}/indicators/IPv4/"
                f"{ioc}/general"
            )

        if ioc_type == "DOMAIN":
            return (
                f"{OTX_API_URL}/indicators/domain/"
                f"{ioc}/general"
            )

        if ioc_type == "URL":
            return (
                f"{OTX_API_URL}/indicators/url/"
                f"{ioc}/general"
            )

        if ioc_type in (
            "MD5",
            "SHA1",
            "SHA256"
        ):
            return (
                f"{OTX_API_URL}/indicators/file/"
                f"{ioc}/general"
            )

        return None

    def lookup(self, ioc, ioc_type):
        """
        Perform an AlienVault OTX lookup.
        """

        if not self.supports(ioc_type):
            return {
                "service_name": self.provider_name(),
                "status": "not_supported",
                "data": {},
                "message": (
                    f"AlienVault OTX does not support "
                    f"IOC type: {ioc_type}"
                )
            }

        api_key = self._get_api_key()

        if not api_key:
            return {
                "service_name": self.provider_name(),
                "status": "error",
                "data": {},
                "message": (
                    "OTX_API_KEY is not configured"
                )
            }

        endpoint = self._get_endpoint(
            ioc,
            ioc_type
        )

        if not endpoint:
            return {
                "service_name": self.provider_name(),
                "status": "error",
                "data": {},
                "message": (
                    "Unable to build OTX API endpoint"
                )
            }

        try:
            response = requests.get(
                endpoint,
                headers={
                    "X-OTX-API-KEY": api_key
                },
                timeout=(5, 30)
            )

            try:
                data = response.json()
            except ValueError:
                data = {
                    "raw_response": response.text
                }

            if response.status_code == 200:
                return {
                    "service_name": self.provider_name(),
                    "status": "success",
                    "data": data
                }

            return {
                "service_name": self.provider_name(),
                "status": "error",
                "data": data,
                "http_status": response.status_code
            }

        except requests.Timeout:
            return {
                "service_name": self.provider_name(),
                "status": "error",
                "data": {},
                "message": (
                    "AlienVault OTX request timed out"
                )
            }

        except requests.RequestException as e:
            return {
                "service_name": self.provider_name(),
                "status": "error",
                "data": {},
                "message": str(e)
            }