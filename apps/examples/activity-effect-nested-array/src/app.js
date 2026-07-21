import { component } from '@loom-js/core';
import { Div, Nav, Ul } from '@loom-js/tags';
import { randomArray } from './activity/random-array.js';

export const App = component(
    (html, { onMounted, onUnmounted, title }) => {
        const { effect, update } = randomArray;
        let intervalId = 0;
        let count = 0;
        const maxUpdates = 2;

        onMounted(() => intervalId = setInterval(() => {
            count < maxUpdates && update();
            count++;
        }, 2000));
        onUnmounted(() => clearInterval(intervalId));

        return html`<>
            <h1>${title}</h1>
            <main>
                ${Ul({
            style: { display: 'flex', 'flex-direction': 'column' },
            children: [effect(
                ({ value: colors }) => Div({
                    style: {
                        'background-color': colors[0],
                        height: '50px',
                        width: '50px'
                    }
                })), Nav({
                    children: effect(
                        ({ value: colors }) => colors?.map(
                            (color) => Div({
                                style: {
                                    'background-color': color,
                                    height: '50px',
                                    width: '50px'
                                }
                            }))
                    )
                }),
            Div({
                children: 'Nested Div 1'
            }),
            Div({
                children: 'Nested Div 2'
            })]
        })}${Ul({
            style: { display: 'flex', 'flex-direction': 'column' },
            children: effect(
                ({ value: colors }) => colors?.slice(0, 3).map(
                    (color) => Div({
                        style: {
                            'background-color': color,
                            height: '50px',
                            width: '50px'
                        }
                    }))
            )
        })}
                ${effect(
            ({ value: colors }) => colors?.map(
                (color) => Div({
                    style: {
                        'background-color': color,
                        height: '50px',
                        width: '50px'
                    }
                }))
        )}
            </main>
        </>`;
    }
);
