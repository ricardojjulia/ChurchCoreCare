FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /workspace

COPY agents/translation_guardian/requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip && pip install -r /tmp/requirements.txt
RUN python -m playwright install --with-deps chromium

COPY . /workspace

EXPOSE 8088

CMD ["python", "-m", "agentdev", "run", "agents/translation_guardian/server.py", "--port", "8088", "--verbose"]