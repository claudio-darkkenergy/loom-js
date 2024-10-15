import { ContentCard } from '@/app/components/cards/content-card';
import { SecondaryContainer } from '@/app/components/containers/secondary-container';
import { SimpleComponent } from '@loom-js/core';
import { PinkGridBox } from '@loom-js/pink';

export const SyntaxCards: SimpleComponent = () => {
    const syntaxVariants = [
        {
            title: 'Functional'
        },
        {
            title: 'Set Up'
        }
    ];

    return SecondaryContainer({
        title: 'Crafting Code With Loom',
        children: PinkGridBox({
            // className: classNames('u-text-center', styles.featured),
            cols: 1,
            gridAutoRows: 'auto',
            item: ContentCard,
            itemProps: syntaxVariants
        })
    });
};
