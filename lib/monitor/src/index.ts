export type MonitorEventDataLevel = 'error' | 'info' | 'log' | 'warn';

export interface MonitorEventData {
    data?: any;
    label: string;
    level?: MonitorEventDataLevel;
    service?: string;
    tag?: string;
}

export const track = (
    url: string,
    { level = 'log', ...evData }: MonitorEventData
) => {
    const data = { level, ...evData };
    console.log('Tracking', data);
    fetch(`${url}/api/log`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: new Headers({
            'Content-Type': 'application/json'
            // mode: 'no-cors'
        })
    });
};
