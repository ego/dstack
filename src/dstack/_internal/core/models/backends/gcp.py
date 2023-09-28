from typing import List, Optional, Union

from pydantic import BaseModel, Field
from typing_extensions import Literal

from dstack._internal.core.models.backends.base import ConfigElement, ConfigMultiElement


class GCPConfigInfo(BaseModel):
    type: Literal["gcp"] = "gcp"
    project_id: str
    regions: List[str]


class GCPServiceAccountCreds(BaseModel):
    type: Literal["service_account"] = "service_account"
    filename: str
    data: str


class GCPDefaultCreds(BaseModel):
    type: Literal["default"] = "default"


AnyGCPCreds = Union[GCPServiceAccountCreds, GCPDefaultCreds]


class GCPCreds(BaseModel):
    __root__: AnyGCPCreds = Field(..., discriminator="type")


class GCPConfigInfoWithCreds(GCPConfigInfo):
    creds: AnyGCPCreds


AnyGCPConfigInfo = Union[GCPConfigInfo, GCPConfigInfoWithCreds]


class GCPConfigInfoWithCredsPartial(BaseModel):
    type: Literal["gcp"] = "gcp"
    creds: Optional[AnyGCPCreds]
    project_id: Optional[str]
    regions: Optional[List[str]]


class GCPConfigValues(BaseModel):
    type: Literal["gcp"] = "gcp"
    default_creds: bool = False
    project_id: Optional[ConfigElement]
    regions: Optional[ConfigMultiElement]
