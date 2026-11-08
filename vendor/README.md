# vendor

CDN 대신 저장소에 고정해 넣은 라이브러리([ADR 0003](../docs/adr/0003-no-framework-vendored-libs.md)). 출시 2주 이상 지난 안정판만 쓴다. 갱신은 npm 패키지에서 같은 파일을 직접 교체한다.

| 라이브러리 | 버전 | 출시일 | 라이선스 | 넣은 파일 (npm 패키지 안 경로) |
|---|---|---|---|---|
| marked | 18.1.1 | 2026-10-12 | MIT (`marked/LICENSE`) | `lib/marked.esm.js` |
| gsap | 3.15.0 | 2026-04-13 | [Standard 'no charge' license](https://gsap.com/standard-license) | `index.js`, `gsap-core.js`, `CSSPlugin.js`, `ScrollTrigger.js`, `Observer.js`(ScrollTrigger 의존), `ScrollToPlugin.js` |

three는 "필요 시"이므로 4단계에서 쓰기로 정하면 추가한다.

## 쓰는 법 (ES 모듈)

```js
import { marked } from '../vendor/marked/marked.esm.js';
import { gsap } from '../vendor/gsap/index.js';
import { ScrollTrigger } from '../vendor/gsap/ScrollTrigger.js';
import { ScrollToPlugin } from '../vendor/gsap/ScrollToPlugin.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
```
