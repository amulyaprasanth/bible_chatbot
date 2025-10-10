import streamlit as st
import uuid
import time
from src.bible_assistant import BibleAssistant

# --------------------------------------------------
# Page Config
# --------------------------------------------------
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

# --------------------------------------------------
# Language Selection
# --------------------------------------------------
col1, col2 = st.columns([1, 1])
if "selected_language" not in st.session_state:
    st.session_state.selected_language = "english"

if "assistants" not in st.session_state:
    st.session_state.assistants = {}

language = st.session_state.selected_language

with col1:
    if st.button("English", use_container_width=True):
        if language != "english":
            language = "english"

with col2:
    if st.button("Telugu", use_container_width=True):
        if language != "telugu":
            language = "telugu"

# Update language state
language_changed = language != st.session_state.selected_language
st.session_state.selected_language = language

# --------------------------------------------------
# Session & Assistant Management
# --------------------------------------------------
if "sessionid" not in st.session_state:
    st.session_state.sessionid = str(uuid.uuid4())

session_id = f"{st.session_state.sessionid}_{language}"

# Create assistant per language (cached)
if language not in st.session_state.assistants:
    with st.spinner(f"Loading {language.capitalize()} Bible assistant..."):
        st.session_state.assistants[language] = BibleAssistant(language)
        time.sleep(0.3)

assistant = st.session_state.assistants[language]

# Reset chat history on language switch
if language_changed or "chat_history" not in st.session_state:
    st.session_state.chat_history = []
    st.success(f"✅ Switched to {language.capitalize()} Bible!")

# --------------------------------------------------
# Chat History Display
# --------------------------------------------------
for role, message in st.session_state.chat_history:
    with st.chat_message(role):
        st.markdown(message)

# --------------------------------------------------
# User Input & Assistant Response
# --------------------------------------------------
user_query = st.chat_input("Ask something about the Bible...")

if user_query:
    st.session_state.chat_history.append(("user", user_query))
    with st.chat_message("user"):
        st.markdown(user_query)

    assistant_placeholder = st.empty()
    streamed_response = ""

    try:
        with st.spinner("Assistant is thinking..."):
            full_response = assistant.query(user_query, session_id=session_id)
            time.sleep(0.3)

        # Simulate smooth streaming (chunked)
        for i in range(0, len(full_response), 5):
            streamed_response = full_response[:i + 5]
            assistant_placeholder.markdown(streamed_response + "▌")
            time.sleep(0.02)

        assistant_placeholder.markdown(streamed_response)

    except Exception as e:
        error_msg = f"❌ Sorry, something went wrong: {e}"
        assistant_placeholder.markdown(error_msg)
        st.error(error_msg)
        streamed_response = error_msg

    st.session_state.chat_history.append(("assistant", streamed_response))

# --------------------------------------------------
# Footer
# --------------------------------------------------
st.divider()
st.caption("💡 Tip: You can switch between English and Telugu anytime. Your chat history resets per language.")
