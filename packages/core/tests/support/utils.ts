export const argException = (value: string | number, position: number) =>
    `at arg ${position}, actually called w/ ${value}`;
export const callCountException = (count: number) =>
    `actually called ${count} ${count === 1 ? 'time' : 'times'}`;
export const randomNumber = (size = 1000) => Math.round(Math.random() * size);
