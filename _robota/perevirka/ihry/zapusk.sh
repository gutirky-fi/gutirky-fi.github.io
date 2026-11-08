#!/bin/sh
# Запускає локальний сайт (8766) і тестовий звʼязок (9001), якщо вони ще не працюють.
T=$(cd "$(dirname "$0")" && pwd); R=$(cd "$T/../../.." && pwd)
curl -s -o /dev/null localhost:8766/ || (cd "$R" && nohup python3 -m http.server 8766 >/dev/null 2>&1 &)
curl -s -o /dev/null localhost:9001/ ; [ $? -eq 7 ] && (nohup node "$T/mini.js" 9001 >/dev/null 2>&1 &)
sleep 1; echo "сайт: http://127.0.0.1:8766  звʼязок: ws://127.0.0.1:9001"
