import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

EventCategory = Literal["ACADEMIC", "MEMBERSHIP", "ORGANIZATION", "EVENT", "DEADLINE"]


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None
    category: str
    starts_on: date
    ends_on: date | None
    is_flagship: bool
    image_url: str | None
    link_url: str | None
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class EventCreate(BaseModel):
    title: str = Field(min_length=1)
    description: str | None = None
    category: EventCategory
    starts_on: date
    ends_on: date | None = None
    is_flagship: bool = False
    image_url: str | None = None
    link_url: HttpUrl | None = None
    display_order: int = 0

    @model_validator(mode="after")
    def validate_dates(self) -> "EventCreate":
        if self.ends_on is not None and self.ends_on < self.starts_on:
            raise ValueError("End date must be on or after start date.")
        return self


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    category: EventCategory | None = None
    starts_on: date | None = None
    ends_on: date | None = None
    is_flagship: bool | None = None
    image_url: str | None = None
    link_url: HttpUrl | None = None
    display_order: int | None = None
    is_active: bool | None = None


class EventList(BaseModel):
    items: list[EventRead]
    meta: dict
