"""테스트용 정적 서버.

python -m http.server는 연결 대기열이 5개라서, Playwright가 여러 페이지를 동시에 열면
Windows가 넘친 연결을 거절한다(ERR_CONNECTION_REFUSED → 글꼴·스크립트 누락).
대기열을 늘리고 접속 기록을 끈 것 말고는 http.server와 같다.
"""
import functools
import http.server
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 256
    daemon_threads = True


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = functools.partial(Handler, directory=str(ROOT))
    with Server(('127.0.0.1', port), handler) as httpd:
        httpd.serve_forever()
