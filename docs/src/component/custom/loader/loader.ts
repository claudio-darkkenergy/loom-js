import { component } from '@loomjs/core';

import styles from './styles.scss';

const Loader = component(
    (Template) => Template`

    <svg class=${styles.loader} viewBox="0 0 10 10" style="width: 5em;">
        <path
            fill="currentColor"
            d="M 5,0
                A5 5 90 0 1 10,5
                L8,5
                A3 3 90 0 0 5,2Z"
        />
        <path
            fill="currentColor"
            opacity="0.25"
            d="M5,0
                A5 5 90 1 0 10,5
                L8,5
                A3 3 90 1 1 5,2Z"
        />
    </svg>

`
);

export { Loader };
