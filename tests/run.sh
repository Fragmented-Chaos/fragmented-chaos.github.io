#!/bin/sh
# site-v2 全部测试：静态检查 + 浏览器行为
set -e
cd "$(dirname "$0")/.."
echo "======== 静态检查 ========"
python3 tests/check.py
echo
echo "======== 浏览器行为 ========"
python3 tests/browser_test.py
