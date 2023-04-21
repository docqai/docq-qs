import streamlit as st
import numpy as np
import pandas as pd

from poetry_demo import load_web_data

st.title("Plotting Demo")


@st.cache_data
def load_data(nrows):
    return load_web_data(nrows)

data_load_state = st.text('Loading data...')

data = load_data(1000)

data_load_state.text('Done!')

st.subheader('Raw data')
st.write(data)

st.subheader('Number of pickups by hour')
hist_values = np.histogram(data['date/time'].dt.hour, bins=24, range=(0, 24))[0]

st.bar_chart(hist_values)