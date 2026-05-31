import pandas as pd
import numpy as np
import re

# Standard mapping dictionary from Korean headers to standard English keys
HEADER_MAP = {
    '소재지': 'address',
    '주소': 'address',
    '최저가': 'price',
    '최저입찰가': 'price',
    '최저입찰가격': 'price',
    '최저매각가격': 'price',
    '사건번호': 'item_id',
    '관리번호': 'item_id',
    '물건용도': 'ptype',
    '용도': 'ptype',
    '물건유형': 'ptype',
    '감정가': 'appraisal',
    '감정평가액': 'appraisal',
    '매각기일': 'close_date',
    '입찰마감일': 'close_date',
    '비고': 'desc',
    '설명': 'desc',
    '특이사항': 'notes',
    '참고사항': 'notes',
    '서류확인': 'docs_ok'
}

def clean_price(val):
    """Safely convert price strings/numbers to integers."""
    if pd.isna(val):
        return 0
    if isinstance(val, (int, float)):
        return int(val)
    # Remove currency symbols, commas, and whitespace
    clean_str = re.sub(r'[^\d]', '', str(val))
    try:
        return int(clean_str) if clean_str else 0
    except ValueError:
        return 0

def clean_date(val):
    """Normalize dates into YYYY-MM-DD string format."""
    if pd.isna(val):
        return ""
    # Try converting timestamp/datetime
    if isinstance(val, pd.Timestamp) or hasattr(val, 'strftime'):
        return val.strftime('%Y-%m-%d')
    
    val_str = str(val).strip()
    # Handle YYYYMMDD
    if len(val_str) == 8 and val_str.isdigit():
        return f"{val_str[:4]}-{val_str[4:6]}-{val_str[6:]}"
    # Handle YYYY.MM.DD or YYYY/MM/DD or YYYY-MM-DD
    matches = re.findall(r'\d+', val_str)
    if len(matches) >= 3:
        year = matches[0]
        month = matches[1].zfill(2)
        day = matches[2].zfill(2)
        if len(year) == 2: # 26 -> 2026
            year = "20" + year
        return f"{year}-{month}-{day}"
    
    return val_str

def parse_uploaded_file(file_obj, filename):
    """
    Read an uploaded file object (CSV or Excel), rename Korean headers, 
    standardize fields, and return a list of standard dictionaries.
    """
    # Load into DataFrame
    if filename.endswith('.csv'):
        # Try different encodings for Korean CSVs (cp949, euc-kr, utf-8)
        for encoding in ['utf-8', 'cp949', 'euc-kr']:
            try:
                df = pd.read_csv(file_obj, encoding=encoding)
                break
            except Exception:
                file_obj.seek(0)
                continue
        else:
            raise ValueError("CSV file encoding could not be decoded. Please upload UTF-8 or CP949 CSV.")
    elif filename.endswith(('.xls', '.xlsx')):
        df = pd.read_excel(file_obj)
    else:
        raise ValueError("Unsupported file format. Please upload .csv, .xls, or .xlsx.")

    # Strip column names
    df.columns = [str(col).strip() for col in df.columns]
    
    # Rename columns using HEADER_MAP (case-insensitive and partial match lookup as helper)
    rename_dict = {}
    for col in df.columns:
        # Check direct mapping
        if col in HEADER_MAP:
            rename_dict[col] = HEADER_MAP[col]
        else:
            # Check if any key in HEADER_MAP is inside the column name (e.g. "사건번호(2026)" contains "사건번호")
            matched = False
            for kor, eng in HEADER_MAP.items():
                if kor in col:
                    rename_dict[col] = eng
                    matched = True
                    break
            if not matched:
                pass # keep original name or let it be ignored

    df = df.rename(columns=rename_dict)
    
    # Check if essential columns are present. If not, add empty ones
    essential_cols = ['item_id', 'address', 'price', 'appraisal', 'ptype', 'close_date', 'docs_ok', 'desc', 'notes']
    for col in essential_cols:
        if col not in df.columns:
            if col == 'docs_ok':
                df[col] = '아니오'
            elif col in ['price', 'appraisal']:
                df[col] = 0
            else:
                df[col] = ""
                
    # Keep only standardized fields and construct clean dataframe
    clean_items = []
    for _, row in df.iterrows():
        # Address must be valid to be included
        addr = str(row.get('address', '')).strip()
        if not addr or pd.isna(row.get('address')):
            continue
            
        item_id = str(row.get('item_id', '')).strip()
        if not item_id or pd.isna(row.get('item_id')):
            item_id = "임시-" + str(clean_price(row.get('price', 0)))
            
        clean_items.append({
            "item_id": item_id,
            "source": "private",
            "address": addr,
            "price": clean_price(row.get('price', 0)),
            "appraisal": clean_price(row.get('appraisal', 0)),
            "ptype": str(row.get('ptype', '기타')).strip(),
            "close_date": clean_date(row.get('close_date', '')),
            "docs_ok": "예" if str(row.get('docs_ok', '아니오')).strip() in ['예', 'Y', 'y', '1', 'True', 'true'] else "아니오",
            "desc": str(row.get('desc', '')).strip() if not pd.isna(row.get('desc')) else "",
            "notes": str(row.get('notes', '')).strip() if not pd.isna(row.get('notes')) else ""
        })
        
    return clean_items
