from app.services.providers.base_provider import BaseProvider

from app.services.abuseipdb import check_ip


class AbuseIPDBProvider(BaseProvider):
    """
    AbuseIPDB provider adapter.
    """

    def provider_name(self):
        """
        Return the provider name.
        """

        return "AbuseIPDB"

    def supports(self, ioc_type):
        """
        AbuseIPDB supports IP address lookups.
        """

        return ioc_type == "IP"

    def lookup(self, ioc, ioc_type):
        """
        Perform an AbuseIPDB lookup.
        """

        if not self.supports(ioc_type):
            return {
                "service_name": self.provider_name(),
                "status": "not_supported",
                "data": {},
                "message": (
                    f"AbuseIPDB does not support "
                    f"IOC type: {ioc_type}"
                )
            }

        try:
            result = check_ip(ioc)

            if result.get("status") == "success":
                return {
                    "service_name": self.provider_name(),
                    "status": "success",
                    "data": result.get(
                        "data",
                        {}
                    )
                }

            return {
                "service_name": self.provider_name(),
                "status": "error",
                "data": {},
                "message": result.get(
                    "message",
                    "AbuseIPDB lookup failed"
                ),
                "http_status": result.get(
                    "http_status"
                )
            }

        except Exception as e:
            return {
                "service_name": self.provider_name(),
                "status": "error",
                "data": {},
                "message": str(e)
            }