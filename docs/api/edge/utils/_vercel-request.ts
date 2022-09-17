export type VercelResponsePayload = Promise<
    | {
          error: {
              code: number;
              message: any;
          };
          success: boolean;
          data?: undefined;
      }
    | {
          data: any;
          success: boolean;
          error?: undefined;
      }
>;

export const vercelRequest = async (
    input: RequestInfo,
    init: RequestInit & { timeout?: number }
): VercelResponsePayload => {
    let res: Response;
    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = init.timeout || 3000;

    // Handle request timeout.
    setTimeout(() => controller.abort(), timeout);

    try {
        res = (await fetch(input as any, { ...init, signal } as any)) as any;
    } catch (e) {
        console.error(e);
        return {
            error: {
                code: 500,
                message: e
            },
            success: false
        };
    }

    if (!res.ok || res.status >= 400) {
        return {
            error: {
                code: res.status,
                message: res.statusText
            },
            success: false
        };
    }

    return {
        data: await res.json(),
        success: true
    };
};
