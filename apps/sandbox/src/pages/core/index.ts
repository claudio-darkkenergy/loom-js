import { activity, component, onRoute } from '@loom-js/core';
import { Button } from '@loom-js/tags';

export const Core = component((html) => {
    const colors = ['red', 'blue', 'green', 'yellow', 'orange'];
    const colorActivity = activity(colors);

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

    return html`
        <div>
            <h1>
                <a $click=${onRoute} href="/">Index</a>
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
                <!-- # Write me a list of colors -->
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
        </div>
    `;
});
