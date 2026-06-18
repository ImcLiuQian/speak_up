# Speak Up Public Deployment

This deployment keeps the app on one canonical public origin:

- `https://www.speakupcoach.cn/` -> Next.js on `127.0.0.1:3000`
- `https://www.speakupcoach.cn/api/*` -> FastAPI on `127.0.0.1:8000`
- `wss://www.speakupcoach.cn/ws/*` -> FastAPI WebSocket on `127.0.0.1:8000`
- `speakupcoach.cn` and `app.speakupcoach.cn` redirect to `www.speakupcoach.cn` so login cookies stay on one host.

Using HTTPS is required for public camera and microphone access.

## DNS

Create these records in Huawei Cloud DNS after confirming the Aliyun ECS public IP:

```text
speakupcoach.cn      A      <ALIYUN_ECS_PUBLIC_IP>
www.speakupcoach.cn  A      <ALIYUN_ECS_PUBLIC_IP>
app.speakupcoach.cn  A      <ALIYUN_ECS_PUBLIC_IP>
```

Public DNS should return the IP before issuing certificates:

```bash
dig +short speakupcoach.cn
dig +short www.speakupcoach.cn
dig +short app.speakupcoach.cn
```

## ECS ports

Open inbound TCP ports in the Aliyun ECS security group:

```text
80   0.0.0.0/0
443  0.0.0.0/0
```

Keep backend `8000` and frontend `3000` bound to `127.0.0.1`; they do not need public inbound rules.

## Build and run

Example layout:

```bash
sudo mkdir -p /opt/speak_up
sudo rsync -a --delete \
  --exclude .git \
  --exclude frontend/node_modules \
  --exclude frontend/.next \
  --exclude backend/.venv \
  --exclude output \
  ./ /opt/speak_up/
sudo cp /opt/speak_up/deploy/systemd/speak-up-backend.service /etc/systemd/system/
sudo cp /opt/speak_up/deploy/systemd/speak-up-frontend.service /etc/systemd/system/

cd /opt/speak_up/backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt

cd /opt/speak_up/frontend
npm install
npm run build

sudo systemctl daemon-reload
sudo systemctl enable --now speak-up-backend speak-up-frontend
```

Put production secrets in `/opt/speak_up/.env`. Do not commit that file.
Set `SPEAK_UP_ALLOWED_ORIGINS=https://www.speakupcoach.cn` if you override the default CORS list and keep the canonical redirect.
Keep `SPEAK_UP_WEBSOCKET_TOKEN_IN_QUERY=false` for same-domain deployment so WebSocket auth uses the secure login cookie instead of putting tokens in URLs.
The simplified internal-beta login uses SQLite for token/session and active-session state:

```bash
SPEAK_UP_AUTH_DATA_DIR=/opt/speak_up/backend/output/auth_data
SPEAK_UP_AUTH_DB_PATH=/opt/speak_up/backend/output/auth_data/auth.sqlite3
SPEAK_UP_INTERNAL_ACCOUNTS='[{"account":"account-id","password":"password","displayName":"内测用户"}]'
```

当前内测账号身份由生产环境的 `SPEAK_UP_INTERNAL_ACCOUNTS` 管理，口令只放在服务器密钥环境里，不提交到仓库。已配置的测试账号身份：

```text
test_user -> 测试用户
```

Replay video storage uses local disk by default. Turn on the OSS switch when replay media should survive ECS disk cleanup or be served through a private bucket:

```bash
SPEAK_UP_OSS_ENABLED=true
SPEAK_UP_OSS_BUCKET=<bucket>
SPEAK_UP_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
SPEAK_UP_OSS_ACCESS_KEY_ID=<access-key-id>
SPEAK_UP_OSS_ACCESS_KEY_SECRET=<access-key-secret>
SPEAK_UP_OSS_PUBLIC_BASE_URL=
SPEAK_UP_OSS_PREFIX=speak-up
```

If `SPEAK_UP_OSS_ENABLED` is unset or `false`, replay media stays under the backend report output directory. The legacy `SPEAK_UP_STORAGE_DRIVER=oss` value is still accepted for compatibility, but new ECS deployments should use `SPEAK_UP_OSS_ENABLED=true`.

## Nginx and certificate

Install Nginx and Certbot. Bootstrap HTTP first, issue the certificate, then switch to the HTTPS virtual host:

```bash
sudo mkdir -p /var/www/certbot
sudo cp /opt/speak_up/deploy/nginx/speakupcoach.cn.bootstrap.conf /etc/nginx/conf.d/speakupcoach.cn.conf
sudo nginx -t
sudo systemctl reload nginx
sudo certbot certonly --webroot -w /var/www/certbot -d speakupcoach.cn -d www.speakupcoach.cn -d app.speakupcoach.cn
sudo cp /opt/speak_up/deploy/nginx/speakupcoach.cn.conf /etc/nginx/conf.d/speakupcoach.cn.conf
sudo nginx -t
sudo systemctl reload nginx
```

Afterwards verify:

```bash
curl -fsS https://www.speakupcoach.cn/health
curl -I https://www.speakupcoach.cn/
curl -I https://speakupcoach.cn/
curl -I https://app.speakupcoach.cn/
```
