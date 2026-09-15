import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

ResourceType = Literal[
    "GOOGLE_FORM",
    "GOOGLE_SHEET",
    "GOOGLE_DRIVE",
    "GOOGLE_DOC",
    "EXTERNAL_LINK",
]


class PaginationMeta(BaseModel):
    total: int
    offset: int
    limit: int


class ResourceCategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    scope: str
    name: str
    description: str | None
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ResourceCategoryCreate(BaseModel):
    scope: Literal["ACADEMIC", "ORGANIZATIONAL"]
    name: str = Field(min_length=1)
    description: str | None = None
    display_order: int = 0


class ResourceCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    description: str | None = None
    display_order: int | None = None
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def reject_empty_patch(cls, value: str | None) -> str | None:
        return value


class ResourceCategoryList(BaseModel):
    items: list[ResourceCategoryRead]
    meta: PaginationMeta


class ResourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category_id: uuid.UUID
    division_id: uuid.UUID | None
    title: str
    description: str | None
    url: str
    resource_type: str
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category: ResourceCategoryRead


class ResourceCreate(BaseModel):
    category_id: uuid.UUID
    division_id: uuid.UUID | None = None
    title: str = Field(min_length=1)
    description: str | None = None
    url: HttpUrl
    resource_type: ResourceType
    display_order: int = 0


class ResourceUpdate(BaseModel):
    category_id: uuid.UUID | None = None
    division_id: uuid.UUID | None = None
    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    url: HttpUrl | None = None
    resource_type: ResourceType | None = None
    display_order: int | None = None
    is_active: bool | None = None


class ResourceList(BaseModel):
    items: list[ResourceRead]
    meta: PaginationMeta


def to_resource_read(resource, category) -> ResourceRead:
    return ResourceRead(
        id=resource.id,
        category_id=resource.category_id,
        division_id=resource.division_id,
        title=resource.title,
        description=resource.description,
        url=resource.url,
        resource_type=resource.resource_type,
        display_order=resource.display_order,
        is_active=resource.is_active,
        created_at=resource.created_at,
        updated_at=resource.updated_at,
        category=ResourceCategoryRead.model_validate(category),
    )
