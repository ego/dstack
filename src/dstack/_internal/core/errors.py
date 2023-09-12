import enum
from typing import List, Optional


class DstackError(Exception):
    pass


class ServerError(DstackError):
    pass


class ForbiddenError(ServerError):
    pass


class ClientError(DstackError):
    pass


class ServerClientErrorCode(str, enum.Enum):
    SERVER_ERROR = ""
    INVALID_CREDENTIALS = "invalid_credentials"
    BACKEND_NOT_AVAILABLE = "backend_not_available"


class ServerClientError(ServerError, ClientError):
    code: ServerClientErrorCode = ServerClientErrorCode.SERVER_ERROR
    msg: str = ""
    fields: List[List[str]] = []

    def __init__(self, msg: Optional[str] = None, fields: List[List[str]] = None):
        if msg is not None:
            self.msg = msg
        if fields is not None:
            self.fields = fields


class BackendInvalidCredentialsError(ServerClientError):
    code: ServerClientErrorCode = ServerClientErrorCode.INVALID_CREDENTIALS
    msg = "Invalid credentials"


class BackendNotAvailable(ServerClientError):
    code: ServerClientErrorCode = ServerClientErrorCode.BACKEND_NOT_AVAILABLE
    msg = "Backend not available"
