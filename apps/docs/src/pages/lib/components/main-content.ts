import { ContentfulRichText } from '@app/components/simple';
import { MainContentProps } from '@app/pages/types';
import { MARKS } from '@contentful/rich-text-types';
import type { SimpleComponent } from '@loom-js/core';
import {
    PinkButton,
    PinkCodePanel,
    PinkContainer,
    PinkGridBox
} from '@loom-js/pink';
import { H1, H2, Main, Paragraph, Section } from '@loom-js/tags';

export const MainContent: SimpleComponent<MainContentProps> = ({
    page,
    site
}) => {
    console.log({ page, site });

    return [
        PinkContainer({
            children: [
                // Figure({
                //     caption: [
                //         H1({ children: site.logo?.title }),
                //         Span({
                //             children: site.logo?.description
                //             // className: styles.subtitle
                //         })
                //     ],
                //     children: ContentfulImage({
                //         description: 'loomjs logo',
                //         height: 240,
                //         width: 240,
                //         url: '/static/img/loom-logo-64.svg'
                //     })
                //     // className: classNames(styles.siteLogo, className)
                // }),
                H1({ children: site.logo?.title }),
                Paragraph({ children: site.shortDescription }),
                PinkButton({
                    children: 'Start learning',
                    isBig: true
                })
            ]
        }),
        PinkContainer({
            children: PinkGridBox({
                children:
                    // Contentful rich-text content
                    page.contentCollection?.items.map(
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
                                                    PinkCodePanel.Header({
                                                        children:
                                                            site.shortDescription
                                                        // style: 'border-left: 3px solid hsl(var(--color-border, transparent));'
                                                    }),
                                                    PinkCodePanel.Content({
                                                        children:
                                                            String(children)
                                                        // style: 'border-left: 3px solid hsl(var(--color-border, transparent));'
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
                    ) || []
            }),
            gridGap: '3rem',
            is: Main,
            style: 'align-items: center; justify-items: center;'
        })
    ].flat();
};
