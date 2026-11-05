#!/bin/sh
# Serve the app over HTTPS on the LAN so a Quest on the same Wi-Fi gets a
# secure context (needed for WebUSB and WebXR). Self-signed certificate for
# this Mac's current IP, kept in .certs/ (gitignored) and remade when the IP
# changes. The Quest Browser warns once: Advanced → Proceed.
set -e
cd "$(dirname "$0")/.."

PORT=3443
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
if [ -z "$IP" ]; then
  echo "No LAN IP found (Wi-Fi off?)." >&2
  exit 1
fi

mkdir -p .certs
if [ ! -f .certs/cert.pem ] || [ "$(cat .certs/ip 2>/dev/null)" != "$IP" ]; then
  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout .certs/key.pem -out .certs/cert.pem \
    -subj "/CN=$IP" -addext "subjectAltName=IP:$IP,DNS:localhost" 2>/dev/null
  echo "$IP" > .certs/ip
fi

echo ""
echo "  On the Quest, open:  https://$IP:$PORT/"
echo ""
QUEST_CERT=.certs/cert.pem QUEST_KEY=.certs/key.pem \
  exec npx vite --host 0.0.0.0 --port "$PORT" --strictPort
