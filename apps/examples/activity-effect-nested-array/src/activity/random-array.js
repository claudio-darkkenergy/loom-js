import { activity } from '@loom-js/core';

const colorsInit = [
    'blue',
    'red',
    'yellow',
    'orange',
    'purple',
    'black',
    'green'
];

export const randomArray = activity(
    colorsInit,
    ({ update, value: colors }) => update(randomizeArray(colors)),
    { deep: true }
);

function randomizeArray(array) {
    // Create a copy of the input array to avoid modifying the original
    const result = array.slice();
    let swapIndex1 = array.length;
    let swapIndex2;
    let tempValue;

    while (swapIndex1 !== 0) {
        // Pick a remaining element
        swapIndex2 = Math.floor(Math.random() * swapIndex1);
        swapIndex1--;
        // Swap it with the current element
        tempValue = result[swapIndex1];
        result[swapIndex1] = result[swapIndex2];
        result[swapIndex2] = tempValue;
    }

    return result;
}
