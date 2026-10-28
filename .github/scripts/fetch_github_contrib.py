#!/usr/bin/env python3
"""抓 GitHub 贡献日历，写 data/github-contrib.json。

用 Actions 自带的 GITHUB_TOKEN 走 GraphQL —— 不用额外 secret，也不爬网页。
抓不到就保留旧文件、退出 0：宁可数据停更，也不让站点出错。
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

LOGIN = "Fragmented-Chaos"
API = "https://api.github.com/graphql"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "data", "github-contrib.json")

QUERY = """
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays { date contributionCount }
        }
      }
    }
  }
}
"""


def main():
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        print("  没有 GITHUB_TOKEN，跳过", file=sys.stderr)
        return 0

    now = datetime.now(timezone.utc)
    frm = (now - timedelta(days=364)).isoformat(timespec="seconds").replace("+00:00", "Z")
    to = now.isoformat(timespec="seconds").replace("+00:00", "Z")

    body = json.dumps({
        "query": QUERY,
        "variables": {"login": LOGIN, "from": frm, "to": to},
    }).encode()

    req = urllib.request.Request(
        API,
        data=body,
        headers={
            "Authorization": f"bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "fragmented-chaos-site/1.0",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  抓取失败（{type(e).__name__}: {e}）—— 保留旧数据", file=sys.stderr)
        return 0

    if data.get("errors"):
        print(f"  接口报错：{data['errors'][:1]} —— 保留旧数据", file=sys.stderr)
        return 0

    try:
        cal = data["data"]["user"]["contributionsCollection"]["contributionCalendar"]
    except (KeyError, TypeError):
        print("  返回结构不对 —— 保留旧数据", file=sys.stderr)
        return 0

    days = {}
    for week in cal.get("weeks", []):
        for d in week.get("contributionDays", []):
            date = d.get("date")
            if date:
                days[date] = int(d.get("contributionCount") or 0)

    payload = {
        "generated_at": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds"),
        "login": LOGIN,
        "total": int(cal.get("totalContributions") or sum(days.values())),
        "days": dict(sorted(days.items())),
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")

    print(f"  ✓ 最近一年 {payload['total']} 次提交，{len(days)} 天 → {os.path.relpath(OUT, ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
