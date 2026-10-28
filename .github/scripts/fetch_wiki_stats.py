#!/usr/bin/env python3
"""抓 MC百科 用户中心的贡献数据，写成 data/wiki-stats.json。

数据来源（公开、无需登录）：
    POST https://center.mcmod.cn/object/UserHistoryChartData/
    表单字段 data = {"uid": <uid>, "year": <年份>}（值是 JSON 字符串，不是 JSON body）

返回 {"state":0,"chartdata":{"action":{日期:次数},"verify":{...},"total":[...]}}
    action = 编辑次数，verify = 审核次数

抓不到时**保留旧文件**并退出 0：宁可数据停更，也不要把站点搞挂。
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

# 主号 + 小号，页面上显示的是两个账号的合计
ACCOUNTS = [
    (626584, "StewedTuba73416"),
    (656227, "Fragmented_Chaos"),
]
UID = ACCOUNTS[0][0]
API = "https://center.mcmod.cn/object/UserHistoryChartData/"
HOME = "https://center.mcmod.cn/frame/CenterHome/"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "data", "wiki-stats.json")


def post(url, data):
    body = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"https://center.mcmod.cn/626584/",
            "User-Agent": "Mozilla/5.0 (compatible; fragmented-chaos-site/1.0)",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_profile(uid):
    """贡献表：编辑次数/字数、短评数、教程数、注册时间。抓不到就返回空。"""
    try:
        frame = post(HOME, {"uid": uid})
        html = frame.get("html") or ""
    except Exception as e:
        print(f"  贡献表抓取失败（{type(e).__name__}）", file=sys.stderr)
        return {}

    # "总短评数" 那个 title 里还嵌了个 <i>，所以先粗抓再剥标签
    pairs = {}
    for title, text in re.findall(
            r'<span class="title">(.*?)</span>\s*<span class="text">\s*([^<]*?)\s*</span>',
            html, re.S):
        pairs[re.sub(r'<[^>]+>', '', title).strip()] = text

    def num(key):
        m = re.search(r"([\d,]+)", pairs.get(key, ""))
        return int(m.group(1).replace(",", "")) if m else None

    return {
        "group": pairs.get("用户组"),
        "edits": num("总编辑次数"),
        "bytes": num("总编辑字数"),
        "comments": num("总短评数"),
        "tutorials": num("个人教程数"),
        "registered": (pairs.get("注册时间") or "")[:10] or None,
    }


def fetch(uid, year):
    body = urllib.parse.urlencode({"data": json.dumps({"uid": uid, "year": year})}).encode()
    req = urllib.request.Request(
        API,
        data=body,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"https://center.mcmod.cn/{UID}/",
            "User-Agent": "Mozilla/5.0 (compatible; fragmented-chaos-site/1.0)",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    year = datetime.now(timezone.utc).year
    days = {}
    accounts = []
    sums = {"edit": 0, "review": 0, "bytes": 0, "comments": 0, "tutorials": 0}
    registered = None
    ok = False

    for uid, name in ACCOUNTS:
        try:
            data = fetch(uid, year)
        except Exception as e:
            print(f"  账号 {name} 抓取失败（{type(e).__name__}）", file=sys.stderr)
            accounts.append({"uid": uid, "name": name, "error": True})
            continue
        if data.get("state") != 0:
            print(f"  账号 {name} 返回 state={data.get('state')}", file=sys.stderr)
            accounts.append({"uid": uid, "name": name, "error": True})
            continue

        ok = True
        chart = data.get("chartdata") or {}
        edits = {k: int(v) for k, v in (chart.get("action") or {}).items() if str(v).isdigit()}
        reviews = {k: int(v) for k, v in (chart.get("verify") or {}).items() if str(v).isdigit()}

        for d, n in edits.items():
            days.setdefault(d, [0, 0])[0] += n
        for d, n in reviews.items():
            days.setdefault(d, [0, 0])[1] += n

        prof = fetch_profile(uid)
        for key, field in (("bytes", "bytes"), ("comments", "comments"), ("tutorials", "tutorials")):
            v = prof.get(field)
            if v:
                sums[key] += v
        if prof.get("registered"):
            registered = prof["registered"] if not registered else min(registered, prof["registered"])

        sums["edit"] += sum(edits.values())
        sums["review"] += sum(reviews.values())
        accounts.append({
            "uid": uid,
            "name": name,
            "group": prof.get("group"),
            "edits": prof.get("edits") or sum(edits.values()),
            "reviews": sum(reviews.values()),
            "bytes": prof.get("bytes"),
            "comments": prof.get("comments"),
            "tutorials": prof.get("tutorials"),
            "registered": prof.get("registered"),
        })

    if not ok:
        print("  所有账号都抓失败 —— 保留旧数据", file=sys.stderr)
        return 0

    # 以主号表里的总编辑次数为准（图表接口可能不含某些改动），没有就用合计
    payload = {
        "accounts": accounts,
        "profile": {
            "registered": registered,
            "bytes": sums["bytes"] or None,
            "comments": sums["comments"] or None,
            "tutorials": sums["tutorials"],
        },
        "generated_at": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds"),
        "uid": ACCOUNTS[0][0],
        "totals": {
            "edit": sums["edit"],
            "review": sums["review"],
        },
        "days": dict(sorted(days.items())),
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")

    print(f"  ✓ 编辑 {payload['totals']['edit']} 次 / 审核 {payload['totals']['review']} 次，"
          f"{len(days)} 天有记录 → {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
