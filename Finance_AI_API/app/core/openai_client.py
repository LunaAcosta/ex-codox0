from openai import OpenAI

from app.core.config import settings


class OpenAIClient:
    _client = None

    @classmethod
    def get_client(cls):

        if cls._client is None:
            cls._client = OpenAI(api_key=settings.OPENAI_API_KEY)

        return cls._client
