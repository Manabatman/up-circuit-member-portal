import uuid
from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

EventCategory = Literal["ACADEMIC", "MEMBERSHIP", "ORGANIZATION", "EVENT", "DEADLINE"]


def _validate_time_range(
    starts_on: date,
    ends_on: date | None,
    start_time: time | None,
    end_time: time | None,
) -> None:
    if ends_on is not None and ends_on < starts_on:
        raise ValueError("End date must be on or after start date.")
    single_day = ends_on is None or ends_on == starts_on
    if single_day and start_time is not None and end_time is not None and end_time < start_time:
        raise ValueError("End time must be on or after start time for single-day events.")


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None
    category: str
    starts_on: date
    ends_on: date | None
    start_time: time | None
    end_time: time | None
    location: str | None
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
    start_time: time | None = None
    end_time: time | None = None
    location: str | None = None
    is_flagship: bool = False
    image_url: str | None = None
    link_url: HttpUrl | None = None
    display_order: int = 0

    @model_validator(mode="after")
    def validate_dates(self) -> "EventCreate":
        _validate_time_range(
            self.starts_on,
            self.ends_on,
            self.start_time,
            self.end_time,
        )
        return self


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    category: EventCategory | None = None
    starts_on: date | None = None
    ends_on: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    location: str | None = None
    is_flagship: bool | None = None
    image_url: str | None = None
    link_url: HttpUrl | None = None
    display_order: int | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_dates(self) -> "EventUpdate":
        if self.starts_on is None:
            return self
        ends = self.ends_on
        _validate_time_range(
            self.starts_on,
            ends,
            self.start_time,
            self.end_time,
        )
        return self


class EventList(BaseModel):
    items: list[EventRead]
    meta: dict
