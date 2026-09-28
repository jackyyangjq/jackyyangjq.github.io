export interface LocaleMessages {
  common: {
    all: string;
    copyToClipboard: string;
  };
  navigation: {
    openMainMenu: string;
  };
  theme: {
    system: string;
    light: string;
    dark: string;
    currentTheme: string;
    cycleTheme: string;
  };
  profile: {
    email: string;
    location: string;
    workAddress: string;
    click: string;
    googleMap: string;
    send: string;
    sendEmail: string;
    researchInterests: string;
    like: string;
    liked: string;
    thanks: string;
  };
  home: {
    about: string;
    news: string;
    selectedPublications: string;
    viewAll: string;
  };
  publications: {
    searchPlaceholder: string;
    filters: string;
    year: string;
    type: string;
    noResults: string;
    abstract: string;
    bibtex: string;
    code: string;
  };
  footer: {
    lastUpdated: string;
    builtWithPrism: string;
  };
  research: {
    finding: string;
    highlights: string;
  };
  visitors: {
    title: string;
    countries: string;
    cities: string;
    referrers: string;
    visitors: string;
    pageviews: string;
    fullStats: string;
    loading: string;
    unavailable: string;
    direct: string;
    updated: string;
    privacy: string;
    since: string;
    seeDetails: string;
    noneYet: string;
    legendNone: string;
    visitorUnit: string;
    visitorsUnit: string;
    daily: string;
    showTable: string;
    date: string;
    place: string;
    source: string;
    mapLabel: string;
    cityDot: string;
    optOut: string;
    optIn: string;
    optOutHint: string;
    optedOut: string;
  };
}

const en: LocaleMessages = {
  common: {
    all: 'All',
    copyToClipboard: 'Copy to clipboard',
  },
  navigation: {
    openMainMenu: 'Open main menu',
  },
  theme: {
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    currentTheme: 'Current theme',
    cycleTheme: 'Click to cycle theme',
  },
  profile: {
    email: 'Email',
    location: 'Location',
    workAddress: 'Work Address',
    click: 'Click',
    googleMap: 'Google Map',
    send: 'Send',
    sendEmail: 'Send Email',
    researchInterests: 'Research Interests',
    like: 'Like',
    liked: 'Liked',
    thanks: 'Thanks!',
  },
  home: {
    about: 'About',
    news: 'News',
    selectedPublications: 'Selected Publications',
    viewAll: 'View All',
  },
  publications: {
    searchPlaceholder: 'Search publications...',
    filters: 'Filters',
    year: 'Year',
    type: 'Type',
    noResults: 'No publications found matching your criteria.',
    abstract: 'Abstract',
    bibtex: 'BibTeX',
    code: 'Code',
  },
  footer: {
    lastUpdated: 'Last updated',
    builtWithPrism: 'Built with PRISM',
  },
  research: {
    finding: 'Finding',
    highlights: 'Working Papers',
  },
  visitors: {
    title: 'Visitors',
    countries: 'Countries and regions',
    cities: 'Cities',
    referrers: 'Came from',
    visitors: 'Visits',
    pageviews: 'Page views',
    fullStats: 'Full statistics',
    loading: 'Loading visit data…',
    unavailable: 'Visit data could not be loaded (a privacy or ad-blocking extension may be blocking it).',
    direct: 'Direct or bookmark',
    updated: 'Updated',
    privacy: "Counted by this site's own counter: no cookies, no IP addresses or browser details stored. A visit is counted once per browser session; places are estimated from network addresses and can be approximate.",
    since: 'Since',
    seeDetails: 'Cities, sources and daily visits',
    noneYet: 'No visits recorded yet: counting has just started.',
    legendNone: 'None',
    visitorUnit: 'visit',
    visitorsUnit: 'visits',
    daily: 'Visits per day, last 30 days',
    showTable: 'Show as table',
    date: 'Date',
    place: 'Place',
    source: 'Source',
    mapLabel: 'World map shaded by the number of visits from each country or region, with dots for cities',
    cityDot: 'city',
    optOut: "Don't count my visits",
    optIn: 'Count them again',
    optOutHint: 'You can stop your visits from this browser being counted.',
    optedOut: 'Your visits from this browser are not counted.',
  },

};

const zh: LocaleMessages = {
  common: {
    all: '全部',
    copyToClipboard: '复制到剪贴板',
  },
  navigation: {
    openMainMenu: '打开主菜单',
  },
  theme: {
    system: '跟随系统',
    light: '浅色',
    dark: '深色',
    currentTheme: '当前主题',
    cycleTheme: '点击切换主题',
  },
  profile: {
    email: '邮箱',
    location: '地址',
    workAddress: '办公地址',
    click: '点击',
    googleMap: '谷歌地图',
    send: '发送',
    sendEmail: '发送邮件',
    researchInterests: '研究兴趣',
    like: '点赞',
    liked: '已点赞',
    thanks: '感谢支持！',
  },
  home: {
    about: '关于我',
    news: '动态',
    selectedPublications: '精选论文',
    viewAll: '查看全部',
  },
  publications: {
    searchPlaceholder: '搜索论文...',
    filters: '筛选',
    year: '年份',
    type: '类型',
    noResults: '没有找到符合条件的论文。',
    abstract: '摘要',
    bibtex: 'BibTeX',
    code: '代码',
  },
  footer: {
    lastUpdated: '最近更新',
    builtWithPrism: '由 PRISM 构建',
  },
  research: {
    finding: '发现',
    highlights: '在审论文',
  },
  visitors: {
    title: '访客',
    countries: '国家和地区',
    cities: '城市',
    referrers: '来源',
    visitors: '访问',
    pageviews: '浏览量',
    fullStats: '完整统计',
    loading: '正在加载访问数据…',
    unavailable: '访问数据暂时无法加载（可能被隐私或广告拦截插件屏蔽）。',
    direct: '直接访问或书签',
    updated: '更新于',
    privacy: '由本站自己的计数程序统计：不用 cookie，不保存 IP 地址和浏览器信息。同一浏览器会话只算一次访问；地点根据网络地址估算，可能有偏差。',
    since: '统计起始',
    seeDetails: '城市、来源和每日访问',
    noneYet: '刚开始统计，暂时还没有访问记录。',
    legendNone: '无',
    visitorUnit: '次访问',
    visitorsUnit: '次访问',
    daily: '最近 30 天每日访问',
    showTable: '以表格显示',
    date: '日期',
    place: '地点',
    source: '来源',
    mapLabel: '按各国家和地区访问次数着色的世界地图，圆点表示城市',
    cityDot: '城市',
    optOut: '不统计我的访问',
    optIn: '恢复统计',
    optOutHint: '你可以让这个浏览器上的访问不被统计。',
    optedOut: '你在这个浏览器上的访问不会被统计。',
  },

};

export const messages: Record<string, LocaleMessages> = {
  en,
  zh,
};

export function getMessages(locale: string): LocaleMessages {
  return messages[locale] || en;
}
