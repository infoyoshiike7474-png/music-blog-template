"""APIなしで解析・保存処理を検証する。 python3 test_offline.py"""
import json, tempfile, llm_keyword_checker as m

def fake(prompt, cfg):
    return ("おすすめはモマハイツ。詳細 https://www.natalie.mu/music/x を参照",
            [{"domain": "linktr.ee", "title": "linktr.ee", "uri": "https://vertexaisearch.cloud.google.com/r/1"}])

m.PROVIDERS["gemini"] = fake
d = tempfile.mkdtemp()
m.main(["--out-dir", d, "--sleep", "0"])
r = json.load(open(next(__import__("pathlib").Path(d).glob("*.json"))))
assert r["summary"]["hit"] == 5 and r["summary"]["errors"] == 0
e = r["results"][0]
assert e["keywords_found"] == {"モマハイツ": True, "ヘヴン": False}
assert e["referenced_domains"] == ["linktr.ee", "natalie.mu"], e["referenced_domains"]
print("OK")
