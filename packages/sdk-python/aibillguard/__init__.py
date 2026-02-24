import json
import threading
from urllib.request import Request, urlopen

_HOST = "https://aibillguard.ai"


def _report(model, input_tokens, output_tokens, key):
    def send():
        try:
            data = json.dumps(
                {"model": model, "input_tokens": input_tokens, "output_tokens": output_tokens}
            ).encode()
            urlopen(
                Request(
                    f"{_HOST}/api/ingest",
                    data=data,
                    headers={
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json",
                    },
                ),
                timeout=5,
            )
        except Exception:
            pass

    threading.Thread(target=send, daemon=True).start()


def wrap_openai(client, key: str):
    orig = client.chat.completions.create

    def tracked(*a, **kw):
        r = orig(*a, **kw)
        try:
            if r.usage:
                _report(r.model, r.usage.prompt_tokens or 0, r.usage.completion_tokens or 0, key)
        except Exception:
            pass
        return r

    client.chat.completions.create = tracked
    return client


def wrap_anthropic(client, key: str):
    orig = client.messages.create

    def tracked(*a, **kw):
        r = orig(*a, **kw)
        try:
            if r.usage:
                _report(r.model, r.usage.input_tokens or 0, r.usage.output_tokens or 0, key)
        except Exception:
            pass
        return r

    client.messages.create = tracked
    return client
