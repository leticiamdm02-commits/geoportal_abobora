"""
Servidor Local para o Geoportal WebGIS da Bacia do Ribeirão Abóbora
Permite execução local instantânea com suporte a CORS e tipos MIME corretos.
"""

import sys
import os
import socket
import webbrowser
import threading
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT_DEFAULT = 8080

class GeoportalRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

    def end_headers(self):
        # Habilitar CORS e desabilitar cache para desenvolvimento ágil
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.geojson'):
            return 'application/geo+json; charset=utf-8'
        elif path.endswith('.json'):
            return 'application/json; charset=utf-8'
        elif path.endswith('.js'):
            return 'application/javascript; charset=utf-8'
        elif path.endswith('.css'):
            return 'text/css; charset=utf-8'
        elif path.endswith('.svg'):
            return 'image/svg+xml; charset=utf-8'
        elif path.endswith('.qml') or path.endswith('.qmd'):
            return 'text/plain; charset=utf-8'
        return super().guess_type(path)

    def log_message(self, format, *args):
        # Log mais limpo no terminal
        sys.stdout.write(f"[{time.strftime('%H:%M:%S')}] {args[0]} - {args[1]}\n")
        sys.stdout.flush()

def find_available_port(start_port=8080, max_attempts=20):
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('localhost', port)) != 0:
                return port
    return start_port

def open_browser(url):
    time.sleep(1.2)
    print(f"Abrindo navegador automaticamente em: {url}")
    webbrowser.open(url)

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = find_available_port(PORT_DEFAULT)
    url = f"http://localhost:{port}"

    server = HTTPServer(('0.0.0.0', port), GeoportalRequestHandler)
    
    print("=" * 65)
    print("      GEOPORTAL • WEBGIS INTERATIVO BACIA DO RIBEIRÃO ABÓBORA    ")
    print("=" * 65)
    print(f" Servidor iniciado com sucesso!")
    print(f" Endereço local: {url}")
    print(f" Pressione CTRL+C nesta janela para encerrar o servidor.")
    print("=" * 65)

    threading.Thread(target=open_browser, args=(url,), daemon=True).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado pelo usuário. Até logo!")
        server.server_close()

if __name__ == '__main__':
    main()
