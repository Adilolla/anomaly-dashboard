FROM python:3.12-slim
WORKDIR /app
COPY services/inference/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/inference/src ./src
ENV PYTHONPATH=/app/src
CMD ["python", "src/worker.py"]
