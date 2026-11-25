import os

import requests

from dotenv import load_dotenv

from app.services.providers.base_provider import BaseProvider


load_dotenv()


PHISHTANK_API_URL = (
    "https://checkurl.phishtank.com/checkurl/"
)


class PhishTankProvider(BaseProvider):
    """
    PhishTank threat-intelligence provider.

    PhishTank's individual lookup API checks URLs
    against its phishing database.

    Supported IOC type:

        URL
    """

    def provider_name(self):
        return "PhishTank"

    def supports(self, ioc_type):
        return ioc_type == "URL"

    def _get_api_key(self):
        """
        Return the optional PhishTank API key.

        The API can work without an application key,
        but rate limits are more restrictive.
        """

        api_key = os.getenv("PHISHTANK_API_KEY")
        return api_key.strip() if api_key else None

    def _get_user_agent(self):
        """
        Return a descriptive User-Agent.

        PhishTank requires applications to identify
        themselves with a descriptive User-Agent.
        """

        return os.getenv(
            "PHISHTANK_USER_AGENT",
            "Automated-Emerging-Cyber-Threat-Identification/1.0"
        )

    def lookup(self, ioc, ioc_type):
        """
        Check an IOC against PhishTank.

        Returns a normalized provider-style response
        compatible with ProviderManager.
        """

        # --------------------------------------------------
        # 1. Check IOC type
        # --------------------------------------------------

        if not self.supports(ioc_type):

            return {
                "service_name": self.provider_name(),
                "status": "not_supported",
                "data": {},
                "message": (
                    "PhishTank individual lookup "
                    "supports URL IOC types only."
                )
            }

        # --------------------------------------------------
        # 2. Get configuration
        # --------------------------------------------------

        api_key = self._get_api_key()

        user_agent = self._get_user_agent()

        # --------------------------------------------------
        # 3. Build request
        # --------------------------------------------------

        payload = {
            "url": ioc,
            "format": "json"
        }

        # API key is optional.
        if api_key:

            payload["app_key"] = api_key

        headers = {
            "User-Agent": user_agent,
            "Accept": "application/json"
        }

        # --------------------------------------------------
        # 4. Send request
        # --------------------------------------------------

        try:

            response = requests.post(
                PHISHTANK_API_URL,
                data=payload,
                headers=headers,
                timeout=15
            )

        except requests.RequestException as e:

            return {
                "service_name": self.provider_name(),
                "status": "error",
                "data": {},
                "message": str(e)
            }

        # --------------------------------------------------
        # 5. Parse response
        # --------------------------------------------------

        try:

            data = response.json()

        except ValueError:

            return {
                "service_name": self.provider_name(),
                "status": "error",
                "data": {},
                "http_status": response.status_code,
                "message": (
                    "PhishTank returned a response "
                    "that was not valid JSON."
                )
            }

        # --------------------------------------------------
        # 6. Handle HTTP errors
        # --------------------------------------------------

        if response.status_code != 200:

            return {
                "service_name": self.provider_name(),
                "status": "error",
                "data": data,
                "http_status": response.status_code,
                "message": (
                    "PhishTank API request failed."
                )
            }

        # --------------------------------------------------
        # 7. Extract result
        # --------------------------------------------------

        results = data.get(
            "results",
            {}
        )

        # PhishTank normally returns the result object
        # for the submitted URL.
        #
        # Be defensive in case the API returns a list.

        if isinstance(results, list):

            if results:

                result = results[0]

            else:

                result = {}

        elif isinstance(results, dict):

            result = results

        else:

            result = {}

        # --------------------------------------------------
        # 8. Extract phishing information
        # --------------------------------------------------

        in_database = bool(
            result.get(
                "in_database",
                False
            )
        )

        verified_value = result.get(
            "verified"
        )

        valid_value = result.get(
            "valid"
        )

        # PhishTank may represent these values
        # differently depending on response format.
        #
        # Convert common representations into booleans.

        verified = (
            verified_value is True
            or str(
                verified_value
            ).lower() in (
                "true",
                "yes",
                "y",
                "1"
            )
        )

        valid = (
            valid_value is True
            or str(
                valid_value
            ).lower() in (
                "true",
                "yes",
                "y",
                "1"
            )
        )

        # --------------------------------------------------
        # 9. Determine positive phishing evidence
        # --------------------------------------------------

        positive_evidence = (
            in_database
            and valid
        )

        # --------------------------------------------------
        # 10. Build clean provider data
        # --------------------------------------------------

        provider_data = {
            "url": result.get(
                "url",
                ioc
            ),

            "in_database": in_database,

            "phish_id": result.get(
                "phish_id"
            ),

            "phish_detail_page": result.get(
                "phish_detail_page"
            ),

            "verified": verified,

            "verified_at": result.get(
                "verified_at"
            ),

            "valid": valid,

            "submitted_at": result.get(
                "submitted_at"
            ),

            "positive_evidence": positive_evidence
        }

        # --------------------------------------------------
        # 11. Successful lookup
        # --------------------------------------------------

        return {
            "service_name": self.provider_name(),
            "status": "success",
            "data": provider_data
        }

