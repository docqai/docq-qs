FROM python:3.11-slim

WORKDIR /app

RUN apt-get update

#apt-get install -y build-essential python3-dev libblas3 liblapack3 liblapack-dev libblas-dev gfortran

RUN pip install --upgrade pip

RUN pip install manifest-ml[api]

ENTRYPOINT ["python3", "-m manifest.api.app", "--model_type huggingface", "--model_name_or_path EleutherAI/gpt-j-6B", "--device 0" ]
