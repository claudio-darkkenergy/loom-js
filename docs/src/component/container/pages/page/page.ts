import { pageContentActivity } from '@app/activities/page-content';
import { Article, H1, H2 } from '@app/component/simple';
import { StyledRichText } from '@app/component/styled/content';
import { Site } from '@app/types';

import styles from './styles.scss';

export interface PageProps {
    site: Site;
}

export const Page = (_: PageProps) => {
    const { effect: pageContentEffect } = pageContentActivity;

    return Article({
        children: pageContentEffect(
            ({
                value: {
                    page: { contentCollection, title },
                    pageLoaded
                }
            }) =>
                pageLoaded &&
                Article({
                    children: [
                        H1({ children: title }),
                        ...contentCollection?.items.map(
                            ({ description, title }) =>
                                StyledRichText({
                                    json: description?.json,
                                    title: title && H2({ children: title })
                                })
                        )
                    ],
                    className: styles.page
                })
        )
    });
};
