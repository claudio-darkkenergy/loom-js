import { MainContent } from './lib/components/main-content';
import { App } from '@app/bootstrap';
import { AppLayout } from '@app/components/container/layout/app-layout';
import { ContentfulImage, ContentfulRichText } from '@app/components/simple';
import { MARKS } from '@contentful/rich-text-types';
import { SimpleComponent } from '@loom-js/core';
import { PinkButton, PinkCodePanel, PinkGridBox } from '@loom-js/pink';
import { Figure, H1, H2, Main, Paragraph, Section, Span } from '@loom-js/tags';

const Home: SimpleComponent = (props = {}) => {
    return AppLayout({
        ...props,
        mainContent: MainContent
    });
};

App(Home);
