import styles from './styles.module.css';
import { HeroBanner } from '@/app/components/containers/hero-banner';
import { Features } from '@/app/topics/home/components/features';
import { SyntaxCards } from '@/app/topics/home/components/syntax-container.ts/SyntaxContainer';
import { getImageUrl } from '@loom-js/contentful';
import {
    type ContextFunction,
    route,
    type SimpleComponent
} from '@loom-js/core';
import classNames from 'classnames';

const Home: SimpleComponent = (props) => {
    const features = [
        { title: 'Component Architecture' },
        { title: 'Intentional Reactivity' },
        { title: 'Micro DOM Updates' },
        { title: 'Component Life Cycle Hooks' },
        { title: 'Small API Layer' },
        { title: 'Minimal Learning Curve' }
    ];

    return [
        HeroBanner({
            className: 'u-flex-vertical u-gap-16 u-padding-32 u-text-center',
            imgProps: {
                className: classNames('u-margin-auto', styles.homeHeroGraphic),
                src: getImageUrl({
                    assetId: '2mcJf1ltOD5A4UNR97kqrs',
                    filename: 'home-hero-graphic.png',
                    format: 'webp',
                    spaceId: '2x238mu87414',
                    uid: '05d126eff598d16e9020a6fc7d22d403',
                    width: 320
                })
            } as any,
            title: 'Lightweight. Component-Driven. Reactive.',
            description:
                'Loom is a streamlined JavaScript framework designed for developers who value simplicity and efficiency. Build powerful, component-driven reactive applications without the bloat.',
            ctas: [
                {
                    children: 'Get Started',
                    href: '/docs/get-started',
                    isBig: true,
                    onClick: route
                }
            ]
        }),
        Features({
            features
        }),
        SyntaxCards({})
    ] as ContextFunction[];
};

export default Home;
