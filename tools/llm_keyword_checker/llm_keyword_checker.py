#!/usr/bin/env python3
"""LLMの回答にキーワードが含まれるか・どのドメインが参照されたかを検証し、JSONで保存する。

標準ライブラリのみで動作。既定はGemini(無料枠+検索グラウンディング)。
OpenAIは OPENAI_API_KEY がある場合のみ --providers gemini,openai で追加(有料)。
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

URL_RE = re.compile(r"https?://[^\s)\]>\"'、。]+")
DOMAIN_RE = re.compile(r"^(?:[a-z0-9-]+\.)+[a-z]{2,}$", re.I)


def post_json(url, body, headers=None, retries=3):
    data = json.dumps(body).encode()
    h = {"Content-Type": "application/json", **(headers or {})}
    for i in range(retries):
        req = urllib.request.Request(url, data=data, headers=h)
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503) and i < retries - 1:
                time.sleep(10 * (i + 1))  # 無料枠のレート制限対策
                continue
            raise RuntimeError(f"HTTP {e.code}: {e.read().decode(errors='replace')[:800]}")


def domain_of(url):
    host = (urlparse(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def ask_gemini(prompt, cfg):
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY が未設定です")
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{cfg['gemini_model']}:generateContent")
    body = {"contents": [{"parts": [{"text": prompt}]}]}
    if cfg.get("grounding", True):  # 無料枠では検索グラウンディングが429になることがある
        body["tools"] = [{"google_search": {}}]
    res = post_json(url, body, {"x-goog-api-key": key})
    cand = (res.get("candidates") or [{}])[0]
    text = "".join(p.get("text", "") for p in cand.get("content", {}).get("parts", []))
    sources = []
    for ch in cand.get("groundingMetadata", {}).get("groundingChunks", []):
        web = ch.get("web") or {}
        # uri はリダイレクトURLのことが多く、titleにドメインが入る
        title = web.get("title", "")
        dom = title.lower() if DOMAIN_RE.match(title) else domain_of(web.get("uri", ""))
        sources.append({"domain": dom, "title": title, "uri": web.get("uri", "")})
    return text, sources


def ask_openai(prompt, cfg):
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY が未設定です")
    res = post_json("https://api.openai.com/v1/chat/completions",
                    {"model": cfg["openai_model"],
                     "messages": [{"role": "user", "content": prompt}]},
                    {"Authorization": f"Bearer {key}"})
    return res["choices"][0]["message"]["content"], []


PROVIDERS = {"gemini": ask_gemini, "openai": ask_openai}


def analyze(text, sources, keywords):
    low = text.lower()
    kw = {k: k.lower() in low for k in keywords}
    domains = {s["domain"] for s in sources if s["domain"]}
    domains |= {domain_of(u) for u in URL_RE.findall(text)}
    cited = [s for s in sources if any(k.lower() in (s["title"] + s["uri"]).lower() for k in keywords)]
    return {"keywords_found": kw, "any_keyword_found": any(kw.values()),
            "referenced_domains": sorted(d for d in domains if d),
            "sources": sources, "keyword_in_source_titles": cited}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--config", default=str(Path(__file__).with_name("config.json")))
    ap.add_argument("--providers", default="gemini")
    ap.add_argument("--out-dir", default="results")
    ap.add_argument("--sleep", type=float, default=5.0, help="リクエスト間隔(秒)")
    ap.add_argument("--no-grounding", action="store_true", help="検索グラウンディングを使わない(無料枠向け)")
    a = ap.parse_args(argv)

    cfg = json.loads(Path(a.config).read_text(encoding="utf-8"))
    if a.no_grounding:
        cfg["grounding"] = False
    results = []
    for prov in a.providers.split(","):
        fn = PROVIDERS[prov.strip()]
        for prompt in cfg["prompts"]:
            entry = {"provider": prov, "prompt": prompt}
            try:
                text, sources = fn(prompt, cfg)
                entry.update(response=text, **analyze(text, sources, cfg["keywords"]))
            except Exception as e:  # 1件失敗しても続行
                entry["error"] = str(e)
            results.append(entry)
            print(f"[{prov}] {prompt} -> "
                  f"{'ERROR ' + entry['error'] if 'error' in entry else entry['any_keyword_found']}")
            time.sleep(a.sleep)

    ok = [r for r in results if "error" not in r]
    out = {"checked_at": datetime.now().isoformat(timespec="seconds"),
           "keywords": cfg["keywords"],
           "summary": {"total": len(results), "errors": len(results) - len(ok),
                       "hit": sum(r["any_keyword_found"] for r in ok)},
           "results": results}
    Path(a.out_dir).mkdir(parents=True, exist_ok=True)
    path = Path(a.out_dir) / f"result_{datetime.now():%Y%m%d_%H%M%S}.json"
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"保存: {path}  ヒット {out['summary']['hit']}/{len(ok)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
