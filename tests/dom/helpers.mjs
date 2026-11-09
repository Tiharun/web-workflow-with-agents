// DOM 단위 테스트 공용: 빈 페이지에서 md.js의 buildDoc으로 고정 md 조각을 변환해 #doc에 넣는다(스펙 §6).
export async function render(page, md, guideId = 'final') {
  if (!page.url().endsWith('/tests/dom/blank.html')) await page.goto('/tests/dom/blank.html');
  return page.evaluate(async ([text, id]) => {
    const { buildDoc } = await import('/js/md.js');
    const { guideById } = await import('/js/site-config.js');
    const doc = buildDoc(guideById(id), text);
    let article = document.getElementById('doc');
    if (!article) {
      article = document.createElement('article');
      article.id = 'doc';
      document.body.append(article);
    }
    article.replaceChildren(doc.template.content.cloneNode(true));
    return { headings: doc.headings, stages: doc.stages, title: doc.title };
  }, [md, guideId]);
}
