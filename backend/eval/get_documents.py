import requests
from langchain_core.documents import Document

import warnings
warnings.filterwarnings('ignore')


queries = [
    "fear",
    "anxiety",
    "faith",
    "love",
    "salvation",
    "god", 
    "jesus",
    "trinity",
]



def generate_docs_from_queries(docs: List[Document] | None, queries: List[str] = queries) -> List[Document]:
    for query in queries:
        url = f"https://bible-search.antioch.tech/api/search?verse_query={query}"
        
        # get the response
        response = requests.get(url, verify=False)
        
        
        for doc in response.json():
            metadata = {
                "book_name": doc['book_name'],
                'chapter_number': doc['chapter_number'],
                'verse_number' : doc['verse_number']
            }
            lang_doc = Document(page_content= doc['verse_text'], metadata=metadata)
            docs.append(lang_doc)
            

    return docs
    
    
    
