
# Docq Quick Start (docq-qs) Edition

## Plug-n-Play knowledge portal with secure AI

Introducing [Docq.AI](https://docq.ai):

- One cloud bill Azure/AWS/GCP and no external suppliers
- Easy integration by dropping documents into blob storages (Azure - Blob Storage; AWS - S3; GCP - Cloud Storage)
- Private, organisational data staying within your cloud account network boundary
- Familiar UX for search and chat

## Deploy

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fdocqai%2Fdocq-qs%2Fmain%2Fdeploy%2Fazure%2Ftemplate.json)


### Decide where to run the application

By picking AWS/GCP/Azure, you're making implicit decisions on:
- How to ingest documents
- Which LLM(s) to use
- And other vendor specific services to support the operations

Ideally the choice should be primarily based on the existing cloud infrastructure setup in your organisation.

### Plan the provisioned infrastructure

Again your organisation may already have recommended practices in place for operating cloud infrastructure. 

A few crucial topics relevant to Docq:
- Security: Details such as how the application is accessed by end users and what guardrails are in place to implement the policies.
- Compliance: Following existing procedures and policies
- Cost: Running self-hosted LLMs can be costly therefore choose wisely on right sizing

## Develop

Use LangChain and Streamlit, built by Poetry

1. `poetry install` to get project ready to go
2. `mkdir .streamlit && cp secrets.toml.example .streamlit/secrets.toml` and fill in api credentials
3. `./run.sh` to run it locally
4. Or set up Streamlit [Community Cloud](https://streamlit.io/) to deploy a non-cloud-native version

