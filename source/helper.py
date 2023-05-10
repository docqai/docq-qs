import os
import streamlit as st
import yaml
from yaml.loader import SafeLoader


CONFIG_FILE = 'config.yaml'


def init_envs():
    for k in ['OPENAI_API_KEY', 'COHERE_API_KEY', 'SERPER_API_KEY']:
        os.environ[k] = st.secrets['langchain'][k]


def load_config():
    config = {}

    with open(CONFIG_FILE) as file:
        config = yaml.load(file, Loader=SafeLoader)

    return config


def save_config(config):

    with open(CONFIG_FILE, 'w') as file:
        yaml.dump(config, file)
