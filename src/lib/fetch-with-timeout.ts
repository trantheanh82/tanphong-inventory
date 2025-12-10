
export async function fetchWithTimeout(resource: RequestInfo | URL, options: RequestInit = {}, timeout: number = 30000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
        ...options,
        signal: controller.signal  
    });

    clearTimeout(id);
    return response;
}
