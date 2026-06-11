# -*- coding: utf-8 -*-
import codecs

def convert():
    try:
        with codecs.open("scratch/commit_index.html", "r", "utf-16") as f:
            content = f.read()
        with codecs.open("scratch/commit_index.html", "w", "utf-8") as f:
            f.write(content)
        print("Successfully converted encoding of scratch/commit_index.html to UTF-8")
    except Exception as e:
        print("Failed to convert encoding:", e)

if __name__ == "__main__":
    convert()
