import streamlit as st
import uuid
import time
from src.bible_assistant import BibleAssistant

st.set_page_config(page_title="Bible Chatbot", page_icon=":books:")
st.title("📖 Bible Assistant")

# Introduction
st.markdown(
    "Welcome to our intelligent Bible assistant! "
    "This multilingual chatbot uses advanced AI to help you explore and understand Bible content in both English and Telugu."
)

# Usage instructions
st.info("""
**How to use this application:**
1. Select your preferred Bible language below
2. Type your Bible-related questions in the chat input
3. The AI will provide contextual answers based on the selected Bible version with real-time streaming responses
""")

# Language selection using buttons
col1, col2 = st.columns([1, 1])
language_changed = False

if "selected_language" not in st.session_state:
    st.session_state.selected_language = "english"

with col1:
    if st.button("English", use_container_width=True):
        if st.session_state.selected_language != "english":
            st.session_state.selected_language = "english"
            language_changed = True

with col2:
    if st.button("Telugu", use_container_width=True):
        if st.session_state.selected_language != "telugu":
            st.session_state.selected_language = "telugu"
            language_changed = True

language = st.session_state.selected_language
session_id = f"{st.session_state.get('sessionid', str(uuid.uuid4()))}_{language}"
st.session_state.sessionid = session_id.split("_")[0]

# Initialize assistant if language changes
if "assistant_language" not in st.session_state or language_changed:
    st.session_state.assistant_language = language
    st.session_state.assistant = BibleAssistant(language=language)
    st.session_state.chat_history = []
    st.success(f"Switched to {language.capitalize()} Bible!")

assistant = st.session_state.assistant

# Display chat history
for role, message in st.session_state.chat_history:
    with st.chat_message(role):
        st.markdown(message)

# User input
user_query = st.chat_input("Ask something about the Bible...")

if user_query:
    st.session_state.chat_history.append(("user", user_query))
    with st.chat_message("user"):
        st.markdown(user_query)

    assistant_placeholder = st.empty()

    # Spinner while the assistant "thinks"
    with st.spinner("Assistant is thinking..."):
        full_response = assistant.query(user_query, session_id=session_id)
        time.sleep(0.5)

    # Simulate streaming
    streamed_response = ""
    for char in full_response:
        streamed_response += char
        assistant_placeholder.markdown(streamed_response + "▌")
        time.sleep(0.01)

    assistant_placeholder.markdown(streamed_response)
    st.session_state.chat_history.append(("assistant", streamed_response))
