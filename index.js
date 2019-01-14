const url = require('url');
const cheerio = require('cheerio');
const rp = require('request-promise-native');

module.exports = (context, req, resp) => {
  scrapeContentBlock(context.data)
    .then(html => {
      resp.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      
      resp.end(html);
    })
    .catch(err => {
      resp.end(err.stack);
    });
};

const scrapeContentBlock = async ({ url: pageUrl, sectionTitle }) => {
  const html = await rp(pageUrl);
  const $ = cheerio.load(html);
  const $sections = $('.bandjson');
  const titleLc = sectionTitle.toLowerCase();

  const matchedSection = $sections.get().find(section => {
    return $(section).find('h2').text().toLowerCase() === titleLc;
  });

  if (!matchedSection) {
    return '';
  }

  const { data } = $(matchedSection).data('band-json');
  const render = createCardRenderer(pageUrl);

  return data.cards.map(render).join('');
};

const createCardRenderer = pageUrl => card => `
  <div class="card">
    <div class="card-header">
      <a class="card-thumbnail-link" href="${url.resolve(pageUrl, card.href)}">
        <img class="card-thumbnail-image" src="${getThumbnailUrl(pageUrl, card.image)}" />
      </a>
      
      <p class="card-title-contextual-label">${card.contextualLabel}</p>
        <h2 class="card-title">
          <a class="card-title-link" href="${url.resolve(pageUrl, card.href)}">
            ${card.title}
          </a>
        </h2>
      </p>
    </div>

    <div class="card-description">
      <p>
        ${card.details}
      </p>
    </div>

    <div class="card-footer">
      <a class="card-footer-cta" href="${url.resolve(pageUrl, card.href)}">
        ${card.ctaText}
      </a>
    </div>
  </div>
`;

const getThumbnailUrl = (baseUrl, { images }) => {
  const { src } = images.find(img => img.width === 768) || images[0];
  return url.resolve(baseUrl, src);
};