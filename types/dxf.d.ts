declare module 'dxf' {
  export class Helper {
    constructor(dxfString: string);
    toSVG(): string;
    toPolylines(): unknown;
    groups: unknown;
    parsed: unknown;
    denormalised: unknown;
  }
}
