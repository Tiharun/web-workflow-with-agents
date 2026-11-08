# vendor

CDN 대신 저장소에 고정해 넣은 라이브러리([ADR 0003](../docs/adr/0003-no-framework-vendored-libs.md)). 출시 2주 이상 지난 안정판만 쓴다. 갱신은 npm 패키지에서 같은 파일을 직접 교체한다.

| 라이브러리 | 버전 | 출시일 | 라이선스 | 넣은 파일 (npm 패키지 안 경로) |
|---|---|---|---|---|
| marked | 18.1.1 | 2026-10-12 | MIT (`marked/LICENSE`) | `lib/marked.esm.js` |
| gsap | 3.15.0 | 2026-04-13 | [Standard 'no charge' license](https://gsap.com/standard-license) | `index.js`, `gsap-core.js`, `CSSPlugin.js`, `ScrollTrigger.js`, `Observer.js`(ScrollTrigger 의존), `ScrollToPlugin.js` |

| Inter Variable | 5.3.0 (`@fontsource-variable/inter`) | — | OFL 1.1 (`fonts/inter/LICENSE`) | `files/inter-latin-wght-normal.woff2`, `files/inter-latin-ext-wght-normal.woff2` |
| Pretendard Variable | 1.3.9 (`pretendard`) | — | OFL 1.1 (`fonts/pretendard/LICENSE.txt`) | `dist/web/variable/pretendardvariable-dynamic-subset.css`, `dist/web/variable/woff2-dynamic-subset/` |

폰트의 `@font-face`는 Inter는 `css/site.css`, Pretendard는 위 CSS 파일이 선언한다. 출시일은 확인하지 않아 비워 두었다.

three는 "필요 시"이므로 4단계에서 쓰기로 정하면 추가한다.

## 쓰는 법 (ES 모듈)

```js
import { marked } from '../vendor/marked/marked.esm.js';
import { gsap } from '../vendor/gsap/index.js';
import { ScrollTrigger } from '../vendor/gsap/ScrollTrigger.js';
import { ScrollToPlugin } from '../vendor/gsap/ScrollToPlugin.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
```
