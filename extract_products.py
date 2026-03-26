import json
import re

data_path = '/Users/alanferreiradasilva/.gemini/antigravity/brain/416cdff8-e706-4659-89d2-4e2163d9cf17/.system_generated/steps/20/output.txt'
with open(data_path, 'r') as f:
    data = json.load(f)
    result_text = data['result']
    
    # The result_text contains the JSON array stringified
    # Find the [ { block
    start = result_text.find('[')
    end = result_text.rfind(']') + 1
    json_str = result_text[start:end]
    
    # json_str might have backslash escapes for quotes
    # Let's try to unescape it if needed, but json.loads usually handles it if it's a valid JSON string.
    # Wait, if it was in "result": "...", then it's already a string.
    
    products = json.loads(json_str)
    
    # Save it cleanly
    with open('products_clean.json', 'w') as f2:
        json.dump(products, f2, indent=2)

print(f"Extracted {len(products)} products.")
