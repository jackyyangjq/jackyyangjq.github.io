export interface BasePageConfig {
    type: 'about' | 'publication' | 'card' | 'text' | 'research' | 'visitors';
    title: string;
    description?: string;
}

export interface PublicationPageConfig extends BasePageConfig {
    type: 'publication';
    source: string;
}

export interface LinkItem {
    label: string;
    href: string;
}

export interface TextPageConfig extends BasePageConfig {
    type: 'text';
    source: string;
    downloads?: (LinkItem & { note?: string })[];
}

export interface CardItem {
    title: string;
    subtitle?: string;
    date?: string;
    content?: string;
    tags?: string[];
    link?: string;
    image?: string;
    image_alt?: string;
    links?: LinkItem[];
}

export interface CardGroup {
    title: string;
    description?: string;
    layout?: 'list' | 'grid';
    items: CardItem[];
}

export interface CardPageConfig extends BasePageConfig {
    type: 'card';
    items?: CardItem[];
    groups?: CardGroup[];
}

export interface ResearchItem {
    title: string;
    status?: string;
    venue?: string;
    authorship?: string;
    award?: string;
    summary?: string;
    finding?: string;
    figure?: string;
    figure_alt?: string;
    figure_caption?: string;
    methods?: string[];
    links?: LinkItem[];
}

export interface ResearchGroup {
    id: string;
    title: string;
    description?: string;
    items?: ResearchItem[];
}

export interface MethodArea {
    title: string;
    methods: string[];
    link?: LinkItem;
}

export interface ResearchPageConfig extends BasePageConfig {
    type: 'research';
    note?: string;
    groups: ResearchGroup[];
    methods_title?: string;
    methods_description?: string;
    method_areas?: MethodArea[];
}

export interface VisitorsPageConfig extends BasePageConfig {
    type: 'visitors';
}
