FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y build-essential python3-dev libblas3 liblapack3 liblapack-dev libblas-dev gfortran

RUN pip install --upgrade pip && \
    pip install poetry

COPY . /app

RUN poetry config virtualenvs.in-project true
RUN poetry install --no-interaction --only main

CMD ./run.sh