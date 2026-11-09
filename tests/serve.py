"""테스트용 정적 서버.

python -m http.server는 연결 대기열이 5개라서, Playwright가 여러 페이지를 동시에 열면
Windows가 넘친 연결을 거절한다(ERR_CONNECTION_REFUSED → 글꼴·스크립트 누락).
대기열을 늘리고 접속 기록을 끈 것 말고는 http.server와 같다.

--gzip: GitHub Pages처럼 글자 파일을 gzip으로 준다. 압축이 없으면 Lighthouse가 전송량을
부풀려 재므로, 배포 전 로컬 측정(tools/lighthouse.mjs --local)에만 쓴다.
"""
import functools
import gzip
import http.server
import io
import os
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
GZIP_TYPES = ('text/', 'application/javascript', 'application/json', 'image/svg+xml')


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 256
    daemon_threads = True


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


class GzipHandler(Handler):
    # Pages는 md를 text/markdown으로 주고 압축한다. 여기서도 같은 형식이어야 압축 대상이 된다.
    extensions_map = {**Handler.extensions_map, '.md': 'text/markdown; charset=utf-8'}

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path) and self.path.split('?', 1)[0].endswith('/'):
            path = os.path.join(path, 'index.html')
        ctype = self.guess_type(path)
        wants = 'gzip' in self.headers.get('Accept-Encoding', '')
        if not (wants and os.path.isfile(path) and ctype.startswith(GZIP_TYPES)):
            return super().send_head()
        with open(path, 'rb') as f:
            body = gzip.compress(f.read())
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Encoding', 'gzip')
        self.send_header('Vary', 'Accept-Encoding')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        return io.BytesIO(body)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--gzip']
    port = int(args[0]) if args else 8000
    handler = functools.partial(GzipHandler if '--gzip' in sys.argv else Handler, directory=str(ROOT))
    with Server(('127.0.0.1', port), handler) as httpd:
        httpd.serve_forever()
