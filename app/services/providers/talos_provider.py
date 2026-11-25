from urllib.parse import quote

from app.services.providers.base_provider import BaseProvider


class TalosProvider(BaseProvider):
    """
    Cisco Talos Reputation Center provider.

    The public Talos Reputation Center is a web-based
    reputation lookup service rather than a documented
    public JSON REST API.

    This adapter therefore prepares the official Talos
    lookup URL and returns it as intelligence-reference
    data.

    Supported IOC types:

        IP
        DOMAIN
        URL
        SHA256
    """

    TALOS_REPUTATION_URL = (
        "https://talosintelligence.com/reputation_center"
    )

    def provider_name(self):
        return "Cisco Talos"

    def supports(self, ioc_type):
        supported_types = {
            "IP",
            "DOMAIN",
            "URL",
            "SHA256"
        }

        return ioc_type in supported_types

    def build_lookup_url(self, ioc):
        """
        Build the official Talos Reputation Center URL.

        The IOC is URL-encoded so that URLs and other
        special characters are handled safely.
        """

        encoded_ioc = quote(
            ioc,
            safe=""
        )

        return (
            f"{self.TALOS_REPUTATION_URL}"
            f"?search={encoded_ioc}"
        )

    def lookup(self, ioc, ioc_type):
        """
        Prepare a Cisco Talos reputation lookup.

        Because Talos does not currently document a
        public JSON lookup API for arbitrary IOC queries,
        this method does not pretend to retrieve a
        reputation score automatically.
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
                    "Cisco Talos supports IP, DOMAIN, "
                    "URL and SHA256 lookups."
                )
            }

        # --------------------------------------------------
        # 2. Build official lookup URL
        # --------------------------------------------------

        lookup_url = self.build_lookup_url(
            ioc
        )

        # --------------------------------------------------
        # 3. Return lookup reference
        # --------------------------------------------------

        return {
            "service_name": self.provider_name(),
            "status": "reference",
            "data": {
                "ioc": ioc,
                "ioc_type": ioc_type,
                "lookup_url": lookup_url,
                "automated_lookup": False
            },
            "message": (
                "Cisco Talos public Reputation Center "
                "lookup reference generated. Automated "
                "reputation extraction requires a supported "
                "Talos API or authorized integration."
            )
        }
