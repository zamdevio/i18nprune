const ROBOTS_HEADER = `#    .__________________________.
#    | .___________________. |==|
#    | | ................. | |  |
#    | | ::[ Dear robot ]: | |  |
#    | | ::::[ be nice ]:: | |  |
#    | | ::::::::::::::::: | |  |
#    | | ::::::::::::::::: | |  |
#    | | ::::::::::::::::: | |  |
#    | | ::::::::::::::::: | | ,|
#    | !___________________! |(c|
#    !_______________________!__!
#   /                            \\
#  /  [][][][][][][][][][][][][]  \\
# /  [][][][][][][][][][][][][][]  \\
#(  [][][][][____________][][][][]  )
# \\ ------------------------------ /
#  \\______________________________/


#       _-_
#    /~~   ~~\\
# /~~         ~~\\
#{               }
# \\  _-     -_  /
#   ~  \\\\ //  ~
#_- -   | | _- _
#  _ -  | |   -_
#      // \\\\
# OUR TREE IS A REDWOOD`;

const ROBOTS_FOOTER = `#              ________
#   __,_,     |        |
#  [_|_/      |   OK   |
#   //        |________|
# _//    __  /
#(_|)   |@@|
# \\ \\__ \\--/ __
#  \\o__|----|  |   __
#      \\ }{ /\\ )_ / _\\
#      /\\__\\/\\ \\__O (__
#     (--/\\--)    \\__/
#     _)(  )(_
#    \`---''---\``;

export type RobotsTxtOptions = {
  allow: readonly string[];
  disallow: readonly string[];
  sitemap?: string;
};

/** Build robots.txt using the landing ASCII art template. */
export function renderRobotsTxt(options: RobotsTxtOptions): string {
  const allowBlock = options.allow.map((path) => `Allow: ${path}`).join('\n');
  const disallowBlock = options.disallow.map((path) => `Disallow: ${path}`).join('\n');
  const sitemapLine = options.sitemap ? `\n\nSitemap: ${options.sitemap}` : '';

  return `${ROBOTS_HEADER}


User-agent: *

${allowBlock}


User-agent: *

${disallowBlock}${sitemapLine}


${ROBOTS_FOOTER}
`;
}

export const ROBOTS_PRESETS = {
  landing: {
    allow: ['/', '/icons/', '/favicon.ico'],
    disallow: ['/assets/', '/fonts/', '/og.svg'],
    sitemap: 'https://i18nprune.dev/sitemap.xml',
  },
  docs: {
    allow: ['/', '/favicon.ico'],
    disallow: ['/assets/'],
    sitemap: 'https://docs.i18nprune.dev/sitemap.xml',
  },
  releases: {
    allow: ['/', '/favicon.ico'],
    disallow: ['/data/'],
    sitemap: 'https://releases.i18nprune.dev/sitemap.xml',
  },
  web: {
    allow: ['/', '/favicon.ico'],
    disallow: ['/assets/'],
  },
  git: {
    allow: ['/', '/favicon.ico'],
    disallow: ['/assets/'],
    sitemap: 'https://git.i18nprune.dev/sitemap.xml',
  },
  report: {
    allow: ['/', '/favicon.ico'],
    disallow: ['/assets/'],
  },
  workerDocs: {
    allow: ['/', '/docs', '/openapi.json', '/favicon.ico', '/i18nprune.svg'],
    disallow: ['/v1/', '/projects/', '/reports/', '/capabilities'],
  },
  metaDocs: {
    allow: ['/', '/docs', '/openapi.json', '/favicon.ico', '/i18nprune.svg'],
    disallow: ['/v1/'],
  },
} as const satisfies Record<string, RobotsTxtOptions>;

export function renderRobotsTxtPreset(preset: keyof typeof ROBOTS_PRESETS): string {
  return renderRobotsTxt(ROBOTS_PRESETS[preset]);
}
