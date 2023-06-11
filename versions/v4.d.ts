import { Response } from 'express';
import '@total-typescript/ts-reset';
export type Constructor = {
    [key: string]: string | number | boolean | undefined | Constructor[] | Constructor;
};
declare const render: (html: string, cstr: Constructor, res?: Response) => string;
export default render;
//# sourceMappingURL=v4.d.ts.map