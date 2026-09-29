import { activity, component, el, route } from '@loom-js/core';

interface Photo {
    thumbnailUrl: string;
}

const Button = el('button');
const Img = el('img');

export const Core = component((html, { onCreated }) => {
    const colors = ['red', 'blue', 'green', 'yellow', 'orange'];
    const colorActivity = activity(colors);
    const photosActivity = activity<readonly Photo[] | undefined>(
        undefined,
        ({ update, input }) => {
            console.log({ input });
            console.groupEnd();
            update(input);
        }
    );

    const yesOrNo = () => Boolean(Math.round(Math.random()));

    const dropFirstColor = () => {
        colorActivity.update(colorActivity.value().slice(1));
    };

    const filterColors = () => {
        colorActivity.update(
            colors.filter(() => (Math.random() < 0.75 ? true : false))
        );
    };

    const randomizeColors = () => {
        colorActivity.update([...colors].sort(() => 0.5 - Math.random()));
    };

    /**
     * Updates the color activity with the initial colors.
     *
     * @return void
     */
    const resetColors = () => {
        colorActivity.reset();
    };

    onCreated(() => {
        console.group('onCreated');
        fetch('https://jsonplaceholder.typicode.com/photos?_limit=10')
            .then((res) => res.json())
            .then(photosActivity.update);
    });

    return html`
        <div>
            <h1>
                <a $click=${route} href="/">Index</a>
                <a $click=${route} href="/event-monitoring">Event Monitoring</a>
                > Core
            </h1>

            <ul>
                ${colors.map((color) =>
                    Button({
                        className: color,
                        children: color,
                        style: { 'background-color': color, opacity: 0.5 }
                    })
                )}
            </ul>

            <ul>
                <!-- List of colors to test Array efficiency when using keys w/ reactivity. -->
                ${colorActivity.effect(({ value }) => [
                    ...value.map((color) =>
                        yesOrNo()
                            ? `(${color})`
                            : Button({
                                  className: color,
                                  children: color,
                                  key: color,
                                  style: { 'background-color': color }
                              })
                    )
                ])}
            </ul>

            <button $click=${dropFirstColor}>Drop first color</button>
            <button $click=${filterColors}>Filter colors</button>
            <button $click=${randomizeColors}>Randomize colors</button>
            <button $click=${resetColors}>Reset colors</button>

            <br />
            <br />

            ${photosActivity.effect(({ value }) =>
                value
                    ? value.map((photo) =>
                          Img({
                              attrs: {
                                  alt: '',
                                  src: photo.thumbnailUrl,
                                  width: 200
                              }
                          })
                      )
                    : 'Loading...'
            )}
        </div>
    `;
});
