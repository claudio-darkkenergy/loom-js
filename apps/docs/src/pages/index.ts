import { App } from '@app/bootstrap';
import { AppLayout } from '@app/components/container/layout/app-layout';
import { ContentfulImage, ContentfulRichText } from '@app/components/simple';
import { MARKS } from '@contentful/rich-text-types';
import { SimpleComponent } from '@loom-js/core';
import {
    PinkButton,
    PinkCodePanel,
    PinkCodePanelContent,
    PinkCodePanelHeader,
    PinkGridBox
} from '@loom-js/pink';
import { Figure, H1, H2, Main, Paragraph, Section, Span } from '@loom-js/tags';

const Home: SimpleComponent = (props = {}) => {
    return AppLayout({
        ...props,
        mainContent: ({ page, site }) => {
            console.log({ page, site });
            return PinkGridBox({
                children: [
                    Figure({
                        caption: [
                            H1({ children: site.logo?.title }),
                            Span({
                                children: site.logo?.description
                                // className: styles.subtitle
                            })
                        ],
                        children: ContentfulImage({
                            description: 'loomjs logo',
                            height: 240,
                            width: 240,
                            url: '/static/img/loom-logo-64.svg'
                        })
                        // className: classNames(styles.siteLogo, className)
                    }),
                    Paragraph({ children: site.shortDescription }),
                    PinkButton({ children: 'Start learning', isBig: true }),
                    // Contentful rich-text content
                    ...(page.contentCollection?.items.map(
                        ({ description, title }) =>
                            ContentfulRichText({
                                // className: classNames(styles.richText, className),
                                json: description?.json,
                                options: {
                                    renderMark: {
                                        [MARKS.CODE]: (children) =>
                                            typeof children === 'string' &&
                                            PinkCodePanel({
                                                children: [
                                                    PinkCodePanelHeader({
                                                        children:
                                                            site.shortDescription,
                                                        style: 'border-left: 3px solid hsl(var(--color-border, transparent));'
                                                    }),
                                                    PinkCodePanelContent({
                                                        children:
                                                            String(children),
                                                        style: 'border-left: 3px solid hsl(var(--color-border, transparent));'
                                                        // style: 'background-color: var(--color-8);'
                                                    })
                                                ],
                                                // codePanelContent:
                                                //     'var(--color-6)',
                                                // codePanelTextColor:
                                                //     'var(--color-0)',
                                                is: Section
                                            })
                                    }
                                },
                                title: title && H2({ children: title })
                            })
                    ) || [])
                ],
                cols: 1,
                gridAutoRows: 'auto',
                gridGap: '3rem',
                is: Main,
                style: 'align-items: center; justify-items: center;'
            });
        }
    });
};

App(Home);
