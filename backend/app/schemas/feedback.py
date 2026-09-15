from pydantic import BaseModel, Field, field_validator


class FeedbackCreate(BaseModel):
    category: str = Field(min_length=1, max_length=32)
    message: str = Field(min_length=1, max_length=4000)
    page_path: str = Field(min_length=1, max_length=512)

    @field_validator("category")
    @classmethod
    def category_allowed(cls, value: str) -> str:
        allowed = {"broken", "idea", "story"}
        if value not in allowed:
            raise ValueError("Invalid feedback category.")
        return value

    @field_validator("page_path")
    @classmethod
    def page_path_relative(cls, value: str) -> str:
        if not value.startswith("/") or value.startswith("//"):
            raise ValueError("page_path must be a relative portal path.")
        if ".." in value:
            raise ValueError("page_path must not contain parent segments.")
        return value


class FeedbackCreated(BaseModel):
    id: str
    message: str = "Thank you for your feedback."
