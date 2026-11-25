from abc import ABC, abstractmethod


class BaseProvider(ABC):
    """
    Base interface for all threat-intelligence providers.

    Every provider must implement:
        1. provider_name()
        2. supports()
        3. lookup()
    """

    @abstractmethod
    def provider_name(self):
        """
        Return the name of the threat-intelligence provider.
        """
        pass

    @abstractmethod
    def supports(self, ioc_type):
        """
        Return True if this provider supports
        the given IOC type.
        """
        pass

    @abstractmethod
    def lookup(self, ioc, ioc_type):
        """
        Perform a threat-intelligence lookup.

        Returns a dictionary containing:
            service_name
            status
            data
        """
        pass