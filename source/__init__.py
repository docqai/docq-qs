import os
import streamlit as st
from .brain import answer_via_agent as answer_brain_agent, answer_via_chain as answer_brain_chain

for k in ['OPENAI_API_KEY', 'COHERE_API_KEY', 'SERPER_API_KEY']:
    os.environ[k] = st.secrets['langchain'][k]
