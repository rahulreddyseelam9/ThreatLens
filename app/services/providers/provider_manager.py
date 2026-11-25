from app.services.providers.virustotal_provider import (
    VirusTotalProvider
)

from app.services.providers.abuseipdb_provider import (
    AbuseIPDBProvider
)

from app.services.providers.urlhaus_provider import (
    URLHausProvider
)

from app.services.providers.otx_provider import (
    OTXProvider
)

from app.services.providers.talos_provider import (
    TalosProvider
)


class ProviderManager:
    """
    Coordinates all registered threat-intelligence providers.

    Registered providers:

        1. VirusTotal
        2. AbuseIPDB
        3. URLHaus
        4. AlienVault OTX
        5. Cisco Talos
    """

    def __init__(self):
        self.providers = [
            VirusTotalProvider(),
            AbuseIPDBProvider(),
            URLHausProvider(),
            OTXProvider(),
            TalosProvider()
        ]

    def get_supported_providers(self, ioc_type):
        """
        Return providers that support the given IOC type.
        """

        return [
            provider
            for provider in self.providers
            if provider.supports(ioc_type)
        ]

    def collect_intelligence(self, ioc, ioc_type):
        """
        Collect threat intelligence from all providers
        that support the IOC type.

        Each provider is responsible for returning
        its own result structure.
        """

        results = []

        providers = self.get_supported_providers(
            ioc_type
        )

        for provider in providers:

            result = provider.lookup(
                ioc,
                ioc_type
            )

            results.append(result)

        return results
