import json
import os

# Read the generated updates
with open('/Users/alanferreiradasilva/PLANO_PROJETO_MENU/descriptions_update.json', 'r') as f:
    updates = json.load(f)

# Group updates into batches of 50 to avoid potentially large SQL strings
batch_size = 50
u_items = list(updates.items())

for i in range(0, len(u_items), batch_size):
    batch = u_items[i:i+batch_size]
    
    # Construct a CASE statement for bulk update
    # UPDATE public.produtos SET descricao = CASE id WHEN 'id1' THEN 'desc1' WHEN 'id2' THEN 'desc2' END WHERE id IN ('id1', 'id2')
    
    case_entries = []
    ids = []
    for uid, desc in batch:
        # Escape single quotes for SQL
        safe_desc = desc.replace("'", "''")
        case_entries.append(f"WHEN '{uid}' THEN '{safe_desc}'")
        ids.append(f"'{uid}'")
    
    sql = f"UPDATE public.produtos SET descricao = CASE id {' '.join(case_entries)} END WHERE id IN ({', '.join(ids)});"
    
    # Save each batch to a temporary SQL file to be executed via run_command or just print it for me to use execute_sql
    # Since I have execute_sql, I'll just print them or save to file and read them.
    # Total 203 updates, roughly 4 batches.
    
    print(f"--- BATCH {i//batch_size + 1} ---")
    print(sql)
    print("\n")
