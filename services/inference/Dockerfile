FROM python:3.12-slim
WORKDIR /app
COPY services/inference/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir 'bluerock[oss]'
COPY services/inference/src ./src
COPY database/migrations ./database/migrations
ENV PYTHONPATH=/app/src
RUN mkdir -p /root/.bluerock && printf '%s\n' '{"enable": true, "imports": {"enable": true, "fileslist": true}, "mcp": true}' > /root/.bluerock/bluerock-oss.json
CMD ["python", "-m", "bluerock", "--oss", "--cfg-dir", "/root/.bluerock", "src/worker.py"]
