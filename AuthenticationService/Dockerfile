FROM python:3.12

WORKDIR /AuthenticationService
COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
ENV PYTHONPATH=/AuthenticationService
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
