# nginx.conf template for packaged production
# Rendered by build scripts using ports.json and env overrides

worker_processes  1;
error_log  logs/error.log warn;
pid        logs/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  logs/access.log  main;

    sendfile        on;
    keepalive_timeout  65;

    # Sensible defaults
    client_max_body_size 20m;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    server {
        listen       ${PUBLIC_PORT};
        server_name  localhost;

        # Serve frontend build
        root   ${PACKAGE_ROOT}/web;
        index  index.html;

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy to backend
        location /api/ {
            proxy_pass         http://127.0.0.1:${BACKEND_PORT}/api/;
            proxy_http_version 1.1;
            proxy_set_header   Upgrade $http_upgrade;
            proxy_set_header   Connection "upgrade";
            proxy_set_header   Host $host;
            proxy_set_header   X-Real-IP $remote_addr;
            proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto $scheme;
        }

        # Health endpoints (optional direct)
        location = /health { return 200 'OK'; add_header Content-Type text/plain; }
    }
}