#!/usr/bin/env bash
set -e

echo "=== [1/4] Setting up Python Virtual Environment ==="
cd /home/strongblade/crimegpt/apps/backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Pre-seed SQLite database with FIR cases and BNS provisions
python -c "import database, seed_data; database.init_db(); seed_data.seed_database()"

echo "=== [2/4] Configuring Systemd Service (Port 8001) ==="
sudo tee /etc/systemd/system/crimegpt.service > /dev/null << 'EOF'
[Unit]
Description=CrimeGPT Legal & Case Investigation Engine
After=network.target

[Service]
User=strongblade
Group=strongblade
WorkingDirectory=/home/strongblade/crimegpt/apps/backend
Environment="PATH=/home/strongblade/crimegpt/apps/backend/venv/bin"
Environment="PORT=8001"
ExecStart=/home/strongblade/crimegpt/apps/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable crimegpt.service
sudo systemctl restart crimegpt.service

echo "=== [3/4] Configuring Nginx Reverse Proxy ==="
sudo tee /etc/nginx/sites-available/crimegpt.nightfury.me > /dev/null << 'EOF'
server {
    server_name crimegpt.nightfury.me;

    client_max_body_size 50M;

    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header Referrer-Policy strict-origin-when-cross-origin;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/crimegpt.nightfury.me /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo "=== [4/4] Provisioning Let's Encrypt SSL ==="
sudo certbot --nginx -d crimegpt.nightfury.me --non-interactive --agree-tos --redirect -m admin@nightfury.me || {
    echo "Notice: If certbot fails because DNS has not propagated yet, rerun: sudo certbot --nginx -d crimegpt.nightfury.me"
}

echo ""
echo "=========================================================="
echo " CrimeGPT Deployment Complete! "
echo " Live URL: https://crimegpt.nightfury.me"
echo " Internal Service: 127.0.0.1:8001"
echo "=========================================================="
