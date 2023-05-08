export interface Result<T> {
    success: boolean;
    data: T;
}

export interface ImageConvertResult {
    type: "gif" | "png",
    body: Buffer
}
