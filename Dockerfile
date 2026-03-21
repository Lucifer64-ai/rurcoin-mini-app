FROM python:3.11-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r bot/requirements.txt

CMD ["python3", "bot/main.py"]