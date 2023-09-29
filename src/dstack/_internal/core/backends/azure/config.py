from dstack._internal.core.backends.base.config import BackendConfig
from dstack._internal.core.models.backends.azure import AnyAzureCreds, AzureStoredConfig


class AzureConfig(BackendConfig, AzureStoredConfig):
    creds: AnyAzureCreds
