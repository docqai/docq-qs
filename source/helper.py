import os
import streamlit as st
import yaml
from yaml.loader import SafeLoader


CONFIG_FILE = 'config.yaml'


def init_envs():
    for k in ['OPENAI_API_KEY', 'SERPER_API_KEY', 'PERSIST_MOUNT_PATH']:
        if k not in os.environ:
            os.environ[k] = st.secrets['langchain'][k]

    if 'AZURE_OPENAI_ENDPOINT' in os.environ:
        os.environ['OPENAI_API_TYPE'] = 'azure'
        os.environ['OPENAI_API_VERSION'] = '2023-03-15-preview'
        os.environ['OPENAI_API_BASE'] = os.environ['AZURE_OPENAI_ENDPOINT']
        os.environ['OPENAI_API_KEY'] = os.environ['AZURE_OPENAI_KEY1']
        # os.environ['OPENAI_API_KEY'] = os.environ['AZURE_OPENAI_KEY2']


def load_config():
    config = {}

    with open(CONFIG_FILE) as file:
        config = yaml.load(file, Loader=SafeLoader)

    return config


def save_config(config):

    with open(CONFIG_FILE, 'w') as file:
        yaml.dump(config, file)
