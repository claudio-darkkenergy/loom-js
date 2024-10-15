import styles from './styles.module.css';
import { HeroBanner } from '@/app/components/containers/hero-banner';
import { Features } from '@/app/topics/home/components/features';
import { SyntaxCards } from '@/app/topics/home/components/syntax-container.ts/SyntaxContainer';
import {
    type ContextFunction,
    route,
    type SimpleComponent
} from '@loom-js/core';
import { Main } from '@loom-js/tags';
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
                // height: '455',
                src: '/static/img/home-hero-graphic.png'
                // width: '455'
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
