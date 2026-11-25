from app.services.providers.base_provider import BaseProvider

from app.services.virustotal_service import (
    lookup_ip,
    lookup_domain,
    lookup_url,
    lookup_hash,
    extract_analysis_stats
)


class VirusTotalProvider(BaseProvider):
    """
    VirusTotal provider adapter.

    This class connects the common provider architecture
    with the existing VirusTotal service.
    """

    def provider_name(self):
        """
        Return the provider name.
        """

        return "VirusTotal"

    def supports(self, ioc_type):
        """
        Return True when VirusTotal supports
        the given IOC type.
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

    def lookup(self, ioc, ioc_type):
        """
        Perform a VirusTotal lookup based on IOC type.

        Returns a normalized provider response.
        """

        if not self.supports(ioc_type):
            return {
                "service_name": self.provider_name(),
                "status": "not_supported",
                "data": {},
                "message": (
                    f"VirusTotal does not support "
                    f"IOC type: {ioc_type}"
                )
            }

        try:

            if ioc_type == "IP":
                vt_result = lookup_ip(ioc)

            elif ioc_type == "DOMAIN":
                vt_result = lookup_domain(ioc)

            elif ioc_type == "URL":
                vt_result = lookup_url(ioc)

            elif ioc_type in (
                "MD5",
                "SHA1",
                "SHA256"
            ):
                vt_result = lookup_hash(ioc)

            else:
                return {
                    "service_name": self.provider_name(),
                    "status": "not_supported",
                    "data": {}
                }

            status_code = vt_result.get(
                "status_code"
            )

            if status_code == 200:

                analysis_stats = extract_analysis_stats(
                    vt_result
                )

                return {
                    "service_name": self.provider_name(),
                    "status": "success",
                    "data": analysis_stats
                }

            return {
                "service_name": self.provider_name(),
                "status": "failed",
                "data": vt_result.get(
                    "data",
                    {}
                ),
                "http_status": status_code
            }

        except Exception as e:

            return {
                "service_name": self.provider_name(),
                "status": "error",
                "data": {},
                "message": str(e)
            }